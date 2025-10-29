"""
GitHub repository integration service.

Clones GitHub repositories and extracts code files for processing.
"""
import os
import shutil
import tempfile
import subprocess
from typing import List, Dict, Tuple
from pathlib import Path


class GitHubService:
    """Service for cloning and processing GitHub repositories"""
    
    SUPPORTED_EXTENSIONS = [
        '.py', '.js', '.jsx', '.ts', '.tsx', 
        '.java', '.c', '.h', '.cpp', '.hpp', 
        '.cc', '.cxx', '.hxx', '.go', '.rs'
    ]
    
    def __init__(self):
        self.temp_dir = None
    
    def clone_repository(self, github_url: str) -> str:
        """
        Clone a GitHub repository to a temporary directory.
        
        Args:
            github_url: GitHub repository URL (e.g., https://github.com/user/repo)
            
        Returns:
            Path to the cloned repository
            
        Raises:
            ValueError: If URL is invalid or cloning fails
        """
        # Validate GitHub URL
        if not self._is_valid_github_url(github_url):
            raise ValueError("Invalid GitHub URL. Must be a github.com repository URL")
        
        # Create temporary directory
        self.temp_dir = tempfile.mkdtemp(prefix='codeexplain_')
        
        try:
            # Clone repository (shallow clone for performance)
            print(f"📥 Cloning repository: {github_url}")
            result = subprocess.run(
                ['git', 'clone', '--depth', '1', github_url, self.temp_dir],
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout
            )
            
            if result.returncode != 0:
                raise ValueError(f"Failed to clone repository: {result.stderr}")
            
            print(f"✓ Repository cloned to: {self.temp_dir}")
            return self.temp_dir
            
        except subprocess.TimeoutExpired:
            self.cleanup()
            raise ValueError("Repository cloning timed out (2 minutes)")
        except Exception as e:
            self.cleanup()
            raise ValueError(f"Error cloning repository: {str(e)}")
    
    def extract_code_files(self, repo_path: str, max_files: int = 100) -> List[Dict[str, any]]:
        """
        Extract code files from cloned repository.
        
        Args:
            repo_path: Path to cloned repository
            max_files: Maximum number of files to process (default: 100)
            
        Returns:
            List of dicts with file info: {name, path, content, size}
        """
        code_files = []
        repo_path_obj = Path(repo_path)
        
        # Walk through repository and collect code files
        for file_path in repo_path_obj.rglob('*'):
            # Skip directories
            if not file_path.is_file():
                continue
            
            # Skip hidden files and directories (.git, .github, etc.)
            if any(part.startswith('.') for part in file_path.parts):
                continue
            
            # Skip common non-code directories
            skip_dirs = {'node_modules', '__pycache__', 'dist', 'build', 'target', 'venv', 'env'}
            if any(skip_dir in file_path.parts for skip_dir in skip_dirs):
                continue
            
            # Check if file has supported extension
            if file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                continue
            
            # Read file content
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Skip empty files
                if not content.strip():
                    continue
                
                # Skip very large files (>500KB)
                if len(content) > 500_000:
                    print(f"⚠️  Skipping large file: {file_path.name} ({len(content)} bytes)")
                    continue
                
                # Get relative path from repo root
                relative_path = str(file_path.relative_to(repo_path_obj))
                
                code_files.append({
                    'name': file_path.name,
                    'path': relative_path,
                    'content': content,
                    'size': len(content)
                })
                
                # Stop if we've reached the limit
                if len(code_files) >= max_files:
                    print(f"⚠️  Reached maximum file limit ({max_files})")
                    break
                
            except Exception as e:
                print(f"⚠️  Error reading file {file_path.name}: {e}")
                continue
        
        print(f"✓ Extracted {len(code_files)} code files")
        return code_files
    
    def cleanup(self):
        """Clean up temporary directory"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir)
                print(f"✓ Cleaned up temporary directory: {self.temp_dir}")
            except Exception as e:
                print(f"⚠️  Error cleaning up temp dir: {e}")
        self.temp_dir = None
    
    def _is_valid_github_url(self, url: str) -> bool:
        """Validate if URL is a GitHub repository URL"""
        valid_patterns = [
            'github.com/',
            'https://github.com/',
            'http://github.com/',
            'git@github.com:',
        ]
        return any(pattern in url for pattern in valid_patterns)
    
    @staticmethod
    def extract_repo_name(github_url: str) -> str:
        """
        Extract repository name from GitHub URL.
        
        Args:
            github_url: GitHub repository URL
            
        Returns:
            Repository name (e.g., "user/repo")
        """
        # Remove protocol and domain
        url = github_url.replace('https://', '').replace('http://', '').replace('git@', '')
        url = url.replace('github.com/', '').replace('github.com:', '')
        
        # Remove .git suffix if present
        url = url.rstrip('/')
        if url.endswith('.git'):
            url = url[:-4]
        
        return url


def process_github_repository(github_url: str, max_files: int = 100) -> Tuple[str, List[Dict[str, any]]]:
    """
    Convenience function to clone and extract files from GitHub repository.
    
    Args:
        github_url: GitHub repository URL
        max_files: Maximum number of files to process
        
    Returns:
        Tuple of (repo_name, list of file dicts)
    """
    service = GitHubService()
    
    try:
        # Extract repository name
        repo_name = service.extract_repo_name(github_url)
        
        # Clone repository
        repo_path = service.clone_repository(github_url)
        
        # Extract code files
        files = service.extract_code_files(repo_path, max_files)
        
        if not files:
            raise ValueError("No supported code files found in repository")
        
        return repo_name, files
        
    finally:
        # Always cleanup
        service.cleanup()

