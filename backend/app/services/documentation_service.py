"""
Complete documentation generation pipeline.

Orchestrates the entire process:
1. Parse code with tree-sitter
2. Generate AI documentation for functions/classes
3. Generate file summary
4. Add inline comments (if needed)
5. Combine into structured output
"""
from app.services.code_parser import CodeParser
from app.services.ai_service import AIDocumentationService
from typing import Dict, List
import asyncio


class DocumentationPipeline:
    """
    Orchestrates the complete documentation generation process.
    
    Features:
    - Parallel processing of functions and classes
    - Concurrency control for repository processing
    - Comprehensive error handling
    - Progress tracking
    """
    
    def __init__(self):
        self.ai_service = AIDocumentationService()
    
    async def process_file(
        self,
        code: str,
        file_path: str,
        language: str
    ) -> Dict:
        """
        Process a single code file through the complete pipeline.
        
        Args:
            code: Source code content
            file_path: Path to the file
            language: Programming language
            
        Returns:
            Dict with:
            - status: 'success' or 'error'
            - data: Structured documentation (if success)
            - error: Error message (if error)
        """
        try:
            print(f"\n📄 Processing: {file_path}")
            
            # Step 1: Parse code
            print("  1️⃣  Parsing code with tree-sitter...")
            parser = CodeParser(language)
            parsed_code = parser.parse(code)
            
            print(f"     Found: {len(parsed_code['functions'])} functions, "
                  f"{len(parsed_code['classes'])} classes")
            
            # Step 2: Generate documentation for functions (in parallel)
            function_docs = []
            if parsed_code['functions']:
                print(f"  2️⃣  Generating documentation for {len(parsed_code['functions'])} function(s)...")
                function_docs = await asyncio.gather(*[
                    self.ai_service.generate_function_documentation(
                        func,
                        self._get_function_context(code, func),
                        language
                    )
                    for func in parsed_code['functions']
                ])
            
            # Step 3: Generate documentation for classes (in parallel)
            class_docs = []
            if parsed_code['classes']:
                print(f"  3️⃣  Generating documentation for {len(parsed_code['classes'])} class(es)...")
                class_docs = await asyncio.gather(*[
                    self.ai_service.generate_class_documentation(
                        cls,
                        self._get_class_context(code, cls),
                        language
                    )
                    for cls in parsed_code['classes']
                ])
            
            # Step 4: Generate file summary
            print("  4️⃣  Generating file summary...")
            file_summary = await self.ai_service.generate_file_summary(
                parsed_code,
                code,
                language,
                file_path
            )
            
            # Step 5: Generate inline comments (if code is complex)
            commented_code = code
            if parsed_code['complexity'] > 10:
                print(f"  5️⃣  Adding inline comments (complexity: {parsed_code['complexity']})...")
                commented_code = await self.ai_service.generate_inline_comments(
                    code,
                    language,
                    parsed_code
                )
            else:
                print(f"  5️⃣  Skipping inline comments (complexity: {parsed_code['complexity']} ≤ 10)")
            
            # Step 6: Combine results
            documentation = {
                "file_path": file_path,
                "language": language,
                "summary": file_summary,
                "functions": [
                    {**func, "documentation": doc}
                    for func, doc in zip(parsed_code['functions'], function_docs)
                ],
                "classes": [
                    {**cls, "documentation": doc}
                    for cls, doc in zip(parsed_code['classes'], class_docs)
                ],
                "imports": parsed_code['imports'],
                "complexity": parsed_code['complexity'],
                "stats": parsed_code['summary'],
                "documented_code": commented_code
            }
            
            # Print summary
            total_tokens = self.ai_service.get_total_tokens_used()
            estimated_cost = self.ai_service.estimate_cost()
            print(f"  ✅ Processing complete!")
            print(f"     Total tokens: {total_tokens}")
            print(f"     Estimated cost: ${estimated_cost}")
            
            return {
                "status": "success",
                "data": documentation
            }
            
        except Exception as e:
            print(f"  ❌ Error processing {file_path}: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "file_path": file_path
            }
    
    def _get_function_context(self, code: str, func_info: Dict) -> str:
        """
        Extract code context around a function.
        
        Args:
            code: Full source code
            func_info: Function metadata with start_line and end_line
            
        Returns:
            Code snippet with context
        """
        lines = code.split('\n')
        start = max(0, func_info['start_line'] - 1 - 3)  # 3 lines before
        end = min(len(lines), func_info['end_line'] + 3)  # 3 lines after
        return '\n'.join(lines[start:end])
    
    def _get_class_context(self, code: str, class_info: Dict) -> str:
        """
        Extract code context for a class.
        
        Args:
            code: Full source code
            class_info: Class metadata with start_line and end_line
            
        Returns:
            Code snippet with context
        """
        lines = code.split('\n')
        start = max(0, class_info['start_line'] - 1 - 2)  # 2 lines before
        end = min(len(lines), class_info['end_line'] + 2)  # 2 lines after
        return '\n'.join(lines[start:end])
    
    async def process_repository(
        self,
        files: List[Dict],
        max_concurrent: int = 3
    ) -> List[Dict]:
        """
        Process multiple files with concurrency control.
        
        Args:
            files: List of dicts with 'content', 'path', 'language'
            max_concurrent: Maximum concurrent AI requests (to avoid rate limits)
            
        Returns:
            List of processing results
        """
        print(f"\n🔄 Processing repository with {len(files)} file(s)")
        print(f"   Concurrency limit: {max_concurrent}")
        
        # Semaphore to limit concurrent API calls
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_with_semaphore(file_info):
            async with semaphore:
                return await self.process_file(
                    file_info['content'],
                    file_info['path'],
                    file_info['language']
                )
        
        results = await asyncio.gather(*[
            process_with_semaphore(file_info)
            for file_info in files
        ])
        
        # Summary
        successful = sum(1 for r in results if r['status'] == 'success')
        failed = sum(1 for r in results if r['status'] == 'error')
        
        total_tokens = self.ai_service.get_total_tokens_used()
        total_cost = self.ai_service.estimate_cost()
        
        print(f"\n{'='*60}")
        print(f"📊 Repository Processing Complete!")
        print(f"   Successful: {successful}/{len(files)}")
        print(f"   Failed: {failed}/{len(files)}")
        print(f"   Total tokens used: {total_tokens}")
        print(f"   Estimated cost: ${total_cost}")
        print(f"{'='*60}\n")
        
        return results
