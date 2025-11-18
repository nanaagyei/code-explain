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
from sqlalchemy import select
from typing import List
import asyncio
import json

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, CodeFile
from app.models.prompt_template import PromptTemplate
from app.services.documentation_service import DocumentationPipeline
from app.services.code_parser import CodeParser
from app.services.github_service import process_github_repository
from app.services.prompt_template_service import PromptTemplateService
from app.schemas.repository import (
    RepositoryResponse,
    CodeFileResponse,
    RepositoryDetailResponse,
    FileDocumentationResponse
)

router = APIRouter(prefix="/repositories", tags=["repositories"])


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
                detail="No supported files found. Supported: .py, .js, .jsx"
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
            
            # Process each file
            pipeline = DocumentationPipeline()
            
            for file in files:
                try:
                    file.status = "processing"
                    await db.commit()
                    
                    print(f"\n   Processing: {file.file_path}")
                    
                    result = await pipeline.process_file(
                        file.original_content,
                        file.file_path,
                        file.language
                    )
                    
                    if result['status'] == 'success':
                        file.documentation = result['data']
                        file.documented_content = result['data']['documented_code']
                        file.complexity_score = result['data']['complexity']
                        file.status = "completed"
                        print(f"   ✅ {file.file_path} completed")
                    else:
                        file.status = "failed"
                        file.error_message = result.get('error')
                        print(f"   ❌ {file.file_path} failed: {result.get('error')}")
                    
                    repo.processed_files += 1
                    await db.commit()
                    
                except Exception as e:
                    file.status = "failed"
                    file.error_message = str(e)
                    print(f"   ❌ Error processing {file.file_path}: {e}")
                    await db.commit()
            
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
    
    return {
        "repository": repo,
        "files": files
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
    
    # Delete repository (cascade will delete all files)
    await db.delete(repo)
    await db.commit()
    
    print(f"   ✓ Repository deleted successfully")
    
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
