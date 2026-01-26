"""
Repository API endpoints for uploading and managing code repositories.

Features:
- File upload with multi-file support
- Background processing
- Real-time progress via WebSocket
- Documentation retrieval
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect, Form, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from typing import List, Dict, Any
from datetime import datetime
import asyncio
import json

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, CodeFile, SavedExploration
from app.models.billing import CreditTransaction
from app.models.batch_job import BatchJobItem
import uuid
from app.models.prompt_template import PromptTemplate
from app.models.user_api_key import UserApiKey
from app.services.documentation_service import DocumentationPipeline
from app.services.ai_service import AIDocumentationService
from app.services.code_parser import CodeParser
from app.services.github_service import process_github_repository, GitHubService
from app.services.prompt_template_service import PromptTemplateService
from app.services.billing_service import BillingService, InsufficientCreditsError
from app.schemas.repository import (
    RepositoryResponse,
    CodeFileResponse,
    RepositoryDetailResponse,
    FileDocumentationResponse,
    TraceFileResponse,
)

router = APIRouter(prefix="/repositories", tags=["repositories"])


async def _ensure_ai_usage_allowed(current_user: User, db: AsyncSession) -> None:
    """
    Require either a personal API key or at least one platform credit before processing.
    """
    billing_service = BillingService(db)
    has_api_key = await billing_service.user_has_personal_api_key(current_user.id)
    if has_api_key:
        return

    wallet = await billing_service.get_or_create_wallet(current_user.id)
    if wallet.balance_credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Add your own OpenAI API key or purchase credits to run AI features.",
        )
@router.post("/", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
async def create_repository(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    prompt_template_id: int = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload code files and create a new repository for documentation.
    
    Args:
        name: Repository name
        files: List of code files to upload
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created repository with processing status
    """
    try:
        print(f"\n📦 Creating repository: {name}")
        print(f"   User: {current_user.username}")
        print(f"   Files: {len(files)}")

        await _ensure_ai_usage_allowed(current_user, db)
        
        # Create repository record
        repo = Repository(
            user_id=current_user.id,
            name=name,
            total_files=len(files),
            status="pending"
        )
        db.add(repo)
        await db.commit()
        await db.refresh(repo)
        
        print(f"   Repository ID: {repo.id}")
        
        # Save uploaded files
        file_records = []
        for upload_file in files:
            try:
                # Read file content
                content = await upload_file.read()
                content_str = content.decode('utf-8')
                
                # Detect language from file extension
                language = CodeParser.detect_language(upload_file.filename)
                
                if not language:
                    print(f"   ⚠️  Skipping unsupported file: {upload_file.filename}")
                    repo.total_files -= 1
                    continue
                
                # Create file record
                file_record = CodeFile(
                    repository_id=repo.id,
                    file_path=upload_file.filename,
                    language=language,
                    content_hash=CodeParser.get_content_hash(content_str),
                    original_content=content_str,
                    status="pending"
                )
                file_records.append(file_record)
                print(f"   ✓ Added: {upload_file.filename} ({language})")
                
            except Exception as e:
                print(f"   ✗ Error reading {upload_file.filename}: {e}")
                repo.total_files -= 1
    
        # Save all file records
        if file_records:
            db.add_all(file_records)
            await db.commit()
            print(f"   ✓ Saved {len(file_records)} file(s) to database")
            
            # Start async processing in background (don't await)
            asyncio.create_task(process_repository_background(repo.id, prompt_template_id))
            print(f"   🚀 Background processing started")
            
            repo.status = "processing"
            await db.commit()
            await db.refresh(repo)  # Refresh to load all attributes including updated_at
        else:
            repo.status = "failed"
            await db.commit()
            await db.refresh(repo)  # Refresh to load all attributes
            raise HTTPException(
                status_code=400,
                detail=(
                    "No supported files found. Supported: .py, .js, .jsx, .ts, .tsx, "
                    ".java, .c, .h, .cpp, .hpp, .go, .rs"
                )
            )
        
        return repo
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error creating repository: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create repository: {str(e)}"
        )


@router.post("/github", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
async def create_repository_from_github(
    github_url: str = Form(...),
    max_files: int = Form(100),
    prompt_template_id: int = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create repository from GitHub URL.
    
    Clones the GitHub repository, extracts code files, and processes them.
    
    Args:
        github_url: GitHub repository URL
        max_files: Maximum number of files to process (default: 100)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created repository with processing status
    """
    try:
        print(f"\n🐙 Creating repository from GitHub: {github_url}")
        print(f"   User: {current_user.username}")
        print(f"   Max files: {max_files}")

        await _ensure_ai_usage_allowed(current_user, db)
        
        # Clone and extract files
        try:
            repo_name, files = process_github_repository(github_url, max_files)
            print(f"   ✓ Extracted {len(files)} files from {repo_name}")
        except ValueError as e:
            error_msg = str(e)
            print(f"   Validation error: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
        except FileNotFoundError as e:
            error_msg = "Git is not installed. Please ensure git is available in the container."
            print(f"   Git not found: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        except Exception as e:
            error_msg = f"Failed to clone repository: {str(e)}"
            print(f"   Clone error: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
        
        # Create repository record
        repo = Repository(
            user_id=current_user.id,
            name=repo_name,
            url=github_url,
            total_files=len(files),
            status="pending"
        )
        db.add(repo)
        await db.commit()
        await db.refresh(repo)
        
        print(f"   Repository ID: {repo.id}")
        
        # Save extracted files
        file_records = []
        for file_data in files:
            try:
                # Detect language from file extension
                language = CodeParser.detect_language(file_data['name'])
                
                if not language:
                    print(f"   ⚠️  Skipping unsupported file: {file_data['name']}")
                    repo.total_files -= 1
                    continue
                
                # Create file record
                file_record = CodeFile(
                    repository_id=repo.id,
                    file_path=file_data['path'],
                    language=language,
                    content_hash=CodeParser.get_content_hash(file_data['content']),
                    original_content=file_data['content'],
                    status="pending"
                )
                file_records.append(file_record)
                print(f"   ✓ Added: {file_data['path']} ({language})")
                
            except Exception as e:
                print(f"   ✗ Error processing {file_data['name']}: {e}")
                repo.total_files -= 1
        
        # Save all file records
        if file_records:
            db.add_all(file_records)
            await db.commit()
            print(f"   ✓ Saved {len(file_records)} file(s) to database")
            
            # Start async processing in background
            asyncio.create_task(process_repository_background(repo.id, prompt_template_id))
            print(f"   🚀 Background processing started")
            
            repo.status = "processing"
            await db.commit()
            await db.refresh(repo)
        else:
            repo.status = "failed"
            await db.commit()
            await db.refresh(repo)
            raise HTTPException(
                status_code=400,
                detail="No supported code files found in repository"
            )
        
        return repo
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"   ❌ Error creating repository from GitHub: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to create repository from GitHub"
        )


async def process_repository_background(repository_id: int, prompt_template_id: int = None):
    """
    Background task to process repository files.
    
    This runs asynchronously and generates documentation for all files.
    
    Args:
        repository_id: ID of repository to process
    """
    # Create new DB session for background task
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        try:
            # Get repository and files
            repo_result = await db.execute(
                select(Repository).where(Repository.id == repository_id)
            )
            repo = repo_result.scalar_one_or_none()
            
            if not repo:
                print(f"❌ Repository {repository_id} not found")
                return
            
            files_result = await db.execute(
                select(CodeFile).where(CodeFile.repository_id == repository_id)
            )
            files = files_result.scalars().all()
            
            print(f"\n🔄 Background processing for repository: {repo.name}")
            print(f"   Files to process: {len(files)}")
            
            # Update status
            repo.status = "processing"
            await db.commit()
            
            billing_service = BillingService(db)
            usage_summary: Dict[int, Dict[str, Any]] = {}
            
            user_api_key = None
            key_result = await db.execute(
                select(UserApiKey)
                .where(
                    UserApiKey.user_id == repo.user_id,
                    UserApiKey.is_active == True  # noqa: E712
                )
                .order_by(UserApiKey.last_used_at.desc(), UserApiKey.created_at.asc())
            )
            user_api_key = key_result.scalars().first()
            
            async def usage_callback(tokens_used: int, context: Dict[str, Any]):
                if tokens_used <= 0:
                    return
                credits_needed = billing_service.tokens_to_credits(tokens_used)
                if credits_needed <= 0:
                    return
                code_file_id = context.get("code_file_id")
                description = f"AI usage - {context.get('stage', 'unknown')}"
                await billing_service.debit_credits(
                    user_id=repo.user_id,
                    credits=credits_needed,
                    tokens=tokens_used,
                    description=description,
                    source="repository_processing",
                    repository_id=repo.id,
                    code_file_id=code_file_id,
                    extra_metadata=context,
                )
                if code_file_id:
                    entry = usage_summary.setdefault(
                        code_file_id,
                        {"tokens": 0, "credits": 0, "events": []}
                    )
                    entry["tokens"] += tokens_used
                    entry["credits"] += credits_needed
                    entry["events"].append({
                        "stage": context.get("stage"),
                        "tokens": tokens_used,
                        "credits": credits_needed,
                        "name": context.get("name") or context.get("file_path"),
                    })
                repo.total_credits_charged += credits_needed
                repo.last_billed_at = datetime.utcnow()
            
            ai_service = (
                AIDocumentationService.create_with_user_api_key(user_api_key)
                if user_api_key else AIDocumentationService()
            )
            
            pipeline = DocumentationPipeline(
                usage_callback=None if user_api_key else usage_callback,
                ai_service=ai_service
            )
            
            for file in files:
                try:
                    file.status = "processing"
                    await db.commit()
                    
                    print(f"\n   Processing: {file.file_path}")
                    
                    tokens_before = pipeline.ai_service.get_total_tokens_used()
                    result = await pipeline.process_file(
                        file.original_content,
                        file.file_path,
                        file.language,
                        code_file_id=file.id
                    )
                    tokens_after = pipeline.ai_service.get_total_tokens_used()
                    file.tokens_used = max(0, tokens_after - tokens_before)
                    repo.total_tokens_used += file.tokens_used
                    
                    if result['status'] == 'success':
                        file.documentation = result['data']
                        file.documented_content = result['data']['documented_code']
                        file.complexity_score = result['data']['complexity']
                        file.status = "completed"
                        summary = usage_summary.get(file.id)
                        if summary:
                            file.credits_charged = summary["credits"]
                            file.billing_metadata = summary
                        else:
                            file.credits_charged = 0
                            file.billing_metadata = {
                                "tokens": file.tokens_used,
                                "credits": 0,
                                "events": []
                            }
                        print(f"   ✅ {file.file_path} completed")
                    else:
                        file.status = "failed"
                        file.error_message = result.get('error')
                        print(f"   ❌ {file.file_path} failed: {result.get('error')}")
                    
                    repo.processed_files += 1
                    await db.commit()
                    
                except InsufficientCreditsError:
                    file.status = "failed"
                    file.error_message = (
                        "Insufficient credits to continue processing. "
                        "Please purchase more credits or add your own API key."
                    )
                    await db.commit()
                    repo.status = "failed"
                    await db.commit()
                    print(f"   💸 Stopped processing {file.file_path}: not enough credits")
                    return
                except Exception as e:
                    file.status = "failed"
                    file.error_message = str(e)
                    print(f"   ❌ Error processing {file.file_path}: {e}")
                    await db.commit()
            
            # Generate repository-level "Start Here" summary
            try:
                completed_files = [file for file in files if file.documentation]
                if completed_files:
                    summary_inputs = [
                        {
                            "file_path": file.file_path,
                            "summary": (file.documentation or {}).get("summary", "")
                        }
                        for file in completed_files
                    ]
                    start_here_result = await ai_service.generate_start_here_summary(
                        repo.name,
                        [file.file_path for file in completed_files],
                        summary_inputs
                    )
                    if not user_api_key and start_here_result.tokens_used > 0:
                        await usage_callback(start_here_result.tokens_used, {
                            "stage": "start_here",
                            "repository_id": repo.id
                        })
                    repo.total_tokens_used += start_here_result.tokens_used
                    repo.meta_info = repo.meta_info or {}
                    repo.meta_info["start_here"] = start_here_result.content
                    await db.commit()
            except Exception as e:
                print(f"   ⚠️  Failed to generate Start Here summary: {e}")

            # Update repository status
            repo.status = "completed"
            await db.commit()
            
            print(f"\n✅ Repository '{repo.name}' processing complete!")
            print(f"   Processed: {repo.processed_files}/{repo.total_files}")
            
        except Exception as e:
            print(f"❌ Critical error processing repository {repository_id}: {e}")
            # Try to mark repo as failed
            try:
                repo.status = "failed"
                await db.commit()
            except:
                pass


@router.get("/", response_model=List[RepositoryResponse])
async def get_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all repositories for the current user.
    
    Args:
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of user's repositories
    """
    result = await db.execute(
        select(Repository)
        .where(Repository.user_id == current_user.id)
        .order_by(Repository.created_at.desc())
    )
    repositories = result.scalars().all()
    return repositories


@router.get("/{repository_id}", response_model=RepositoryDetailResponse)
async def get_repository(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get repository details including all files.
    
    Args:
        repository_id: Repository ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Repository with list of files
    """
    # Get repository
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )
    
    # Get files
    files_result = await db.execute(
        select(CodeFile)
        .where(CodeFile.repository_id == repository_id)
        .order_by(CodeFile.file_path)
    )
    files = files_result.scalars().all()
    
    start_here = None
    if repo.meta_info and isinstance(repo.meta_info, dict):
        start_here = repo.meta_info.get("start_here")
    return {
        "repository": repo,
        "files": files,
        "start_here": start_here
    }


@router.get("/{repository_id}/good-first-issues")
async def get_good_first_issues(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get "good first issue" labeled issues from GitHub for this repository.
    
    Args:
        repository_id: Repository ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of good first issues from GitHub
    """
    # Get repository
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Extract GitHub repo name from URL or repo name
    github_repo = None
    if repo.url and 'github.com' in repo.url:
        github_repo = GitHubService.extract_repo_name(repo.url)
    elif '/' in repo.name:
        github_repo = repo.name
    
    if not github_repo:
        return []
    
    # Fetch issues (no token for now - public repos only)
    issues = await GitHubService.fetch_good_first_issues(github_repo)
    return issues


@router.post("/{repository_id}/explorations")
async def save_exploration(
    repository_id: int,
    title: str = Form(...),
    description: str = Form(None),
    state: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save an exploration session for sharing."""
    # Verify ownership
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Create exploration
    exploration = SavedExploration(
        share_id=str(uuid.uuid4()),
        user_id=current_user.id,
        repository_id=repository_id,
        title=title,
        description=description,
        state=json.loads(state) if state else None,
        is_public=1
    )
    db.add(exploration)
    await db.commit()
    await db.refresh(exploration)
    
    return {
        "id": exploration.id,
        "share_id": exploration.share_id,
        "title": exploration.title,
        "share_url": f"/explore/{exploration.share_id}"
    }


@router.get("/explore/{share_id}")
async def get_shared_exploration(
    share_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a shared exploration by its share ID (public endpoint)."""
    result = await db.execute(
        select(SavedExploration).where(
            SavedExploration.share_id == share_id,
            SavedExploration.is_public == 1
        )
    )
    exploration = result.scalar_one_or_none()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")
    
    # Increment view count
    exploration.view_count += 1
    await db.commit()
    
    # Get repository details
    repo_result = await db.execute(
        select(Repository).where(Repository.id == exploration.repository_id)
    )
    repo = repo_result.scalar_one_or_none()
    
    return {
        "id": exploration.id,
        "title": exploration.title,
        "description": exploration.description,
        "state": exploration.state,
        "view_count": exploration.view_count,
        "created_at": exploration.created_at,
        "repository": {
            "id": repo.id if repo else None,
            "name": repo.name if repo else "Unknown"
        }
    }


@router.get("/{repository_id}/explorations")
async def list_explorations(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all saved explorations for a repository."""
    result = await db.execute(
        select(SavedExploration).where(
            SavedExploration.repository_id == repository_id,
            SavedExploration.user_id == current_user.id
        ).order_by(SavedExploration.created_at.desc())
    )
    explorations = result.scalars().all()
    
    return [
        {
            "id": e.id,
            "share_id": e.share_id,
            "title": e.title,
            "description": e.description,
            "view_count": e.view_count,
            "created_at": e.created_at,
            "share_url": f"/explore/{e.share_id}"
        }
        for e in explorations
    ]


@router.post("/{repository_id}/explain-changelog")
async def explain_changelog(
    repository_id: int,
    changelog: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Explain a changelog or commit history in plain language."""
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    ai_service = AIDocumentationService()
    explanation = await ai_service.explain_changelog(changelog, repo.name)
    
    return {
        "repository": repo.name,
        "explanation": explanation.content,
        "tokens_used": explanation.tokens_used
    }


@router.post("/{repository_id}/pr-checklist")
async def generate_pr_checklist(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a pre-PR checklist based on repository analysis."""
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id,
            Repository.status == "completed"
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or not completed")
    
    # Get files for context
    files_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repository_id)
    )
    files = files_result.scalars().all()
    
    file_changes = [
        {"file_path": f.file_path, "change_type": "analyzed", "language": f.language}
        for f in files
    ]
    
    meta = repo.meta_info or {}
    start_here = meta.get("start_here", {})
    repo_context = f"{repo.name} - {start_here.get('project_summary', repo.language or 'Unknown language')}"
    
    ai_service = AIDocumentationService()
    checklist = await ai_service.generate_pr_checklist(file_changes, repo_context)
    
    return {
        "repository": repo.name,
        "checklist": checklist.content,
        "tokens_used": checklist.tokens_used
    }


@router.post("/compare")
async def compare_repositories(
    repo1_id: int = Form(...),
    repo2_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Compare two repositories and generate AI-powered insights."""
    # Fetch both repositories
    result1 = await db.execute(
        select(Repository).where(
            Repository.id == repo1_id,
            Repository.user_id == current_user.id,
            Repository.status == "completed"
        )
    )
    repo1 = result1.scalar_one_or_none()
    
    result2 = await db.execute(
        select(Repository).where(
            Repository.id == repo2_id,
            Repository.user_id == current_user.id,
            Repository.status == "completed"
        )
    )
    repo2 = result2.scalar_one_or_none()
    
    if not repo1 or not repo2:
        raise HTTPException(status_code=404, detail="One or both repositories not found or not completed")
    
    # Get file counts
    files1_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repo1_id)
    )
    files1 = files1_result.scalars().all()
    
    files2_result = await db.execute(
        select(CodeFile).where(CodeFile.repository_id == repo2_id)
    )
    files2 = files2_result.scalars().all()
    
    # Build summaries for comparison
    meta1 = repo1.meta_info or {}
    start_here1 = meta1.get("start_here", {})
    
    meta2 = repo2.meta_info or {}
    start_here2 = meta2.get("start_here", {})
    
    repo1_summary = {
        "language": repo1.language,
        "file_count": len(files1),
        "summary": start_here1.get("project_summary", ""),
        "entry_points": start_here1.get("entry_points", []),
        "architecture": start_here1.get("structure_overview", "")
    }
    
    repo2_summary = {
        "language": repo2.language,
        "file_count": len(files2),
        "summary": start_here2.get("project_summary", ""),
        "entry_points": start_here2.get("entry_points", []),
        "architecture": start_here2.get("structure_overview", "")
    }
    
    # Generate comparison
    ai_service = AIDocumentationService()
    comparison = await ai_service.compare_repositories(
        repo1.name, repo1_summary,
        repo2.name, repo2_summary
    )
    
    return {
        "repo1": {"id": repo1.id, "name": repo1.name},
        "repo2": {"id": repo2.id, "name": repo2.name},
        "comparison": comparison.content,
        "tokens_used": comparison.tokens_used
    }


@router.delete("/{repository_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_repository(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a repository and all its files.
    
    Args:
        repository_id: Repository ID to delete
        current_user: Authenticated user
        db: Database session
        
    Returns:
        204 No Content on success
    """
    # Get repository
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(
            status_code=404,
            detail="Repository not found"
        )
    
    print(f"\n🗑️  Deleting repository: {repo.name} (ID: {repo.id})")
    print(f"   User: {current_user.username}")
    
    try:
        # Remove FK references that would block cascade delete. Order matters.
        await db.execute(delete(SavedExploration).where(SavedExploration.repository_id == repository_id))
        await db.execute(
            update(CreditTransaction)
            .where(CreditTransaction.repository_id == repository_id)
            .values(repository_id=None, code_file_id=None)
        )
        # Null code_file_id for any transaction referencing a file in this repo
        file_ids_result = await db.execute(select(CodeFile.id).where(CodeFile.repository_id == repository_id))
        file_ids = list(file_ids_result.scalars().all())
        if file_ids:
            await db.execute(
                update(CreditTransaction)
                .where(CreditTransaction.code_file_id.in_(file_ids))
                .values(code_file_id=None)
            )
        await db.execute(
            update(BatchJobItem)
            .where(BatchJobItem.repository_id == repository_id)
            .values(repository_id=None)
        )
        # Delete repository (cascade will delete all code_files)
        await db.delete(repo)
        await db.commit()
    except Exception as e:
        await db.rollback()
        print(f"   ❌ Delete failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete repository. Try marking it as failed first if it is still processing, then delete again.",
        ) from e
    
    print(f"   ✓ Repository deleted successfully")
    
    return None


@router.post("/{repository_id}/mark-failed", status_code=status.HTTP_204_NO_CONTENT)
async def mark_repository_failed(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a repository as failed when it is stuck in "processing" (e.g. after a server
    restart that killed the background task). Only allowed when status is "processing".
    """
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if repo.status != "processing":
        raise HTTPException(
            status_code=400,
            detail=f"Can only mark repositories stuck in 'processing' as failed. Current status: {repo.status}",
        )
    repo.status = "failed"
    await db.commit()
    print(f"   ✓ Repository {repo.name} (ID: {repo.id}) marked as failed (was stuck in processing)")
    return None


@router.get("/{repository_id}/files/{file_id}", response_model=FileDocumentationResponse)
async def get_file_documentation(
    repository_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get generated documentation for a specific file.
    
    Args:
        repository_id: Repository ID
        file_id: File ID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        File documentation
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repository_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"File documentation not ready. Status: {file.status}"
        )
    
    if not file.documentation:
        raise HTTPException(
            status_code=404,
            detail="Documentation not available"
        )
    
    return file.documentation


@router.get("/{repository_id}/files/{file_id}/trace", response_model=TraceFileResponse)
async def trace_file(
    repository_id: int,
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trace this file: upstream (who imports it), downstream (what it imports), and a short role.
    """
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id,
        )
    )
    repo = repo_result.scalar_one_or_none()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repository_id,
        )
    )
    file = file_result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    role = ""
    if file.documentation and isinstance(file.documentation, dict):
        role = (file.documentation.get("summary") or "")[:500]

    # TODO: Build repo-level import graph to populate upstream/downstream.
    return TraceFileResponse(upstream=[], downstream=[], role=role)


@router.get("/{repository_id}/files/{file_id}/export", response_class=Response)
async def export_file_documentation(
    repository_id: int,
    file_id: int,
    format: str = "markdown",  # markdown, json, txt
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export file documentation in various formats.
    
    Args:
        repository_id: Repository ID
        file_id: File ID
        format: Export format (markdown, json, txt)
        current_user: Authenticated user
        db: Database session
        
    Returns:
        File download with documentation
    """
    # Verify repository belongs to user
    repo_result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == current_user.id
        )
    )
    repo = repo_result.scalar_one_or_none()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get file
    file_result = await db.execute(
        select(CodeFile).where(
            CodeFile.id == file_id,
            CodeFile.repository_id == repository_id
        )
    )
    file = file_result.scalar_one_or_none()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if not file.documentation:
        raise HTTPException(status_code=404, detail="Documentation not available")
    
    doc = file.documentation
    filename = file.file_path.replace('/', '_').replace('\\', '_')
    
    # Generate content based on format
    if format == "json":
        content = json.dumps(doc, indent=2)
        media_type = "application/json"
        filename = f"{filename}_docs.json"
    elif format == "txt":
        content = generate_text_docs(doc)
        media_type = "text/plain"
        filename = f"{filename}_docs.txt"
    else:  # markdown (default)
        content = generate_markdown_docs(doc)
        media_type = "text/markdown"
        filename = f"{filename}_docs.md"
    
    return Response(
        content=content.encode('utf-8'),
        media_type=media_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


def generate_markdown_docs(doc: dict) -> str:
    """Generate Markdown formatted documentation"""
    md = f"# {doc['file_path']}\n\n"
    md += f"**Language:** {doc['language']}  \n"
    md += f"**Complexity:** {doc['complexity']}  \n"
    md += f"**Total Lines:** {doc['stats']['total_lines']}  \n\n"
    
    md += "## Summary\n\n"
    md += f"{doc['summary']}\n\n"
    
    if doc['functions']:
        md += "## Functions\n\n"
        for func in doc['functions']:
            md += f"### `{func['name']}`\n\n"
            if func['params']:
                md += f"**Parameters:** `{', '.join(func['params'])}`\n\n"
            md += f"**Lines:** {func['start_line']}-{func['end_line']}\n\n"
            md += f"{func['documentation']}\n\n"
    
    if doc['classes']:
        md += "## Classes\n\n"
        for cls in doc['classes']:
            md += f"### `{cls['name']}`\n\n"
            md += f"**Lines:** {cls['start_line']}-{cls['end_line']}\n\n"
            if cls['methods']:
                md += f"**Methods:** {', '.join(cls['methods'])}\n\n"
            md += f"{cls['documentation']}\n\n"
    
    md += "## Source Code\n\n"
    md += f"```{doc['language']}\n"
    md += doc['documented_code']
    md += "\n```\n"
    
    return md


def generate_text_docs(doc: dict) -> str:
    """Generate plain text documentation"""
    txt = f"{'='*80}\n"
    txt += f"{doc['file_path']}\n"
    txt += f"{'='*80}\n\n"
    txt += f"Language: {doc['language']}\n"
    txt += f"Complexity: {doc['complexity']}\n"
    txt += f"Total Lines: {doc['stats']['total_lines']}\n\n"
    
    txt += f"SUMMARY\n{'-'*80}\n"
    txt += f"{doc['summary']}\n\n"
    
    if doc['functions']:
        txt += f"FUNCTIONS\n{'-'*80}\n\n"
        for func in doc['functions']:
            txt += f"{func['name']}"
            if func['params']:
                txt += f"({', '.join(func['params'])})"
            txt += f" [Lines {func['start_line']}-{func['end_line']}]\n"
            txt += f"{func['documentation']}\n\n"
    
    if doc['classes']:
        txt += f"CLASSES\n{'-'*80}\n\n"
        for cls in doc['classes']:
            txt += f"{cls['name']} [Lines {cls['start_line']}-{cls['end_line']}]\n"
            if cls['methods']:
                txt += f"Methods: {', '.join(cls['methods'])}\n"
            txt += f"{cls['documentation']}\n\n"
    
    txt += f"SOURCE CODE\n{'-'*80}\n"
    txt += doc['documented_code']
    
    return txt


@router.websocket("/ws/{repository_id}")
async def repository_websocket(
    websocket: WebSocket,
    repository_id: int,
):
    """
    WebSocket endpoint for real-time repository processing updates.
    
    Args:
        websocket: WebSocket connection
        repository_id: Repository ID to monitor
    """
    await websocket.accept()
    print(f"🔌 WebSocket connected for repository {repository_id}")
    
    # Create DB session for WebSocket
    from app.core.database import AsyncSessionLocal
    
    try:
        async with AsyncSessionLocal() as db:
            previous_processed = -1
            
            while True:
                # Check repository status
                result = await db.execute(
                    select(Repository).where(Repository.id == repository_id)
                )
                repo = result.scalar_one_or_none()
                
                if not repo:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Repository not found"
                    })
                    await websocket.close()
                    break
                
                # Calculate progress
                progress = (repo.processed_files / repo.total_files * 100) if repo.total_files > 0 else 0
                
                # Send update if progress changed
                if repo.processed_files != previous_processed:
                    await websocket.send_json({
                        "type": "progress",
                        "progress": round(progress, 1),
                        "processed": repo.processed_files,
                        "total": repo.total_files,
                        "status": repo.status,
                        "message": f"Processed {repo.processed_files}/{repo.total_files} files"
                    })
                    previous_processed = repo.processed_files
                
                # If completed or failed, send final message
                if repo.status in ["completed", "failed"]:
                    await websocket.send_json({
                        "type": repo.status,
                        "message": f"Repository processing {repo.status}!",
                        "processed": repo.processed_files,
                        "total": repo.total_files
                    })
                    print(f"✓ Repository {repository_id} {repo.status}")
                    break
                
                # Refresh session to get latest data
                await db.refresh(repo)
                
                # Wait before next update
                await asyncio.sleep(2)
                
    except WebSocketDisconnect:
        print(f"🔌 WebSocket disconnected for repository {repository_id}")
    except Exception as e:
        print(f"❌ WebSocket error for repository {repository_id}: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
