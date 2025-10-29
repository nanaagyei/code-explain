"""
AI-powered documentation generation service using OpenAI.

Features:
- Function documentation generation
- Class documentation generation  
- File summary generation
- Inline comment generation
- Intelligent caching to reduce API costs
- Token usage tracking
"""
from openai import OpenAI
from app.core.config import get_settings
from app.core.cache import cache
import asyncio
from typing import Dict, List, Any, Optional
import json
from app.models.prompt_template import PromptTemplate
from app.models.user_api_key import UserApiKey

settings = get_settings()


class AIDocumentationService:
    """
    Generate comprehensive code documentation using OpenAI.
    
    Uses different models based on complexity:
    - GPT-4o for complex code/classes
    - GPT-4o-mini for simple functions
    
    Implements aggressive caching to minimize API costs.
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.gpt4_model = settings.openai_model_gpt4
        self.gpt4_mini_model = settings.openai_model_gpt4_mini
        self.total_tokens_used = 0
    
    async def generate_function_documentation(
        self,
        function_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """
        Generate documentation for a single function.
        
        Args:
            function_info: Dict with function metadata (name, params, docstring, etc.)
            code_context: Code context around the function
            language: Programming language
            
        Returns:
            Generated documentation as markdown string
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "func_doc",
            function_info.get('name'),
            code_context[:100],  # First 100 chars for uniqueness
            language
        )
        
        cached_doc = await cache.get(cache_key)
        if cached_doc:
            print(f"  ♻️  Cache hit for function: {function_info.get('name')}")
            return cached_doc['documentation']
        
        # Generate prompt
        prompt = self._create_function_prompt(function_info, code_context, language)
        
        # Call OpenAI (using asyncio.to_thread for non-blocking)
        print(f"  🤖 Generating docs for function: {function_info.get('name')}")
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_mini_model,  # Use mini for function docs
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert technical writer and software engineer. "
                        "Generate clear, concise, and accurate documentation for code functions. "
                        "Focus on what the function does, its parameters, return values, and any important behavior."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,  # Low temperature for consistent technical writing
            max_tokens=500
        )
        
        documentation = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        # Track token usage
        self.total_tokens_used += tokens_used
        print(f"    Tokens used: {tokens_used}")
        
        # Cache result for 24 hours
        await cache.set(cache_key, {"documentation": documentation}, expire=86400)
        
        return documentation
    
    def _create_function_prompt(
        self,
        function_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Create prompt for function documentation"""
        
        existing_docstring = function_info.get('docstring', 'None')
        
        prompt = f"""Generate comprehensive documentation for this {language} function.

**Function Name:** `{function_info.get('name')}`  
**Parameters:** {', '.join(function_info.get('params', [])) or 'None'}  
**Existing Docstring:** {existing_docstring}

**Code:**
```{language}
{code_context}
```

**Generate documentation that includes:**

1. **Brief Description** (1-2 sentences): What does this function do?
2. **Parameters**: Explain each parameter and its purpose
3. **Returns**: What does the function return?
4. **Usage Example** (if helpful): A simple code example
5. **Notes**: Any important details, edge cases, or gotchas

Format your response in clear markdown. Be concise but thorough."""
        
        return prompt
    
    async def generate_class_documentation(
        self,
        class_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """
        Generate documentation for a class.
        
        Args:
            class_info: Dict with class metadata (name, methods, etc.)
            code_context: Code context for the class
            language: Programming language
            
        Returns:
            Generated documentation as markdown string
        """
        # Check cache
        cache_key = cache.generate_cache_key(
            "class_doc",
            class_info.get('name'),
            code_context[:100],
            language
        )
        
        cached_doc = await cache.get(cache_key)
        if cached_doc:
            print(f"  ♻️  Cache hit for class: {class_info.get('name')}")
            return cached_doc['documentation']
        
        prompt = self._create_class_prompt(class_info, code_context, language)
        
        # Use GPT-4 for complex class documentation
        print(f"  🤖 Generating docs for class: {class_info.get('name')}")
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,  # Use GPT-4 for classes
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert software architect and technical writer. "
                        "Generate comprehensive class documentation that explains purpose, "
                        "responsibilities, key methods, and design patterns."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        documentation = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        self.total_tokens_used += tokens_used
        print(f"    Tokens used: {tokens_used}")
        
        # Cache for 24 hours
        await cache.set(cache_key, {"documentation": documentation}, expire=86400)
        
        return documentation
    
    def _create_class_prompt(
        self,
        class_info: Dict,
        code_context: str,
        language: str
    ) -> str:
        """Create prompt for class documentation"""
        
        methods = class_info.get('methods', [])
        
        prompt = f"""Generate comprehensive documentation for this {language} class.

**Class Name:** `{class_info.get('name')}`  
**Methods:** {len(methods)} method(s) - {', '.join(methods[:5]) if methods else 'None'}

**Code:**
```{language}
{code_context}
```

**Generate documentation that includes:**

1. **Class Purpose**: What is the responsibility of this class?
2. **Key Features**: Main capabilities and features
3. **Methods Overview**: Brief description of important methods
4. **Usage Example**: How to instantiate and use this class
5. **Design Patterns**: Any notable patterns used (if applicable)
6. **Relationships**: How it interacts with other components

Format your response in clear markdown. Focus on high-level understanding."""
        
        return prompt
    
    async def generate_file_summary(
        self,
        parsed_code: Dict,
        code: str,
        language: str,
        file_path: str
    ) -> str:
        """
        Generate high-level summary for an entire file.
        
        Args:
            parsed_code: Parsed code structure (functions, classes, etc.)
            code: Original source code
            language: Programming language
            file_path: File path
            
        Returns:
            File summary as markdown string
        """
        # Check cache
        cache_key = cache.generate_cache_key(
            "file_summary",
            file_path,
            str(parsed_code.get('complexity')),
            language
        )
        
        cached_summary = await cache.get(cache_key)
        if cached_summary:
            print(f"  ♻️  Cache hit for file summary")
            return cached_summary['summary']
        
        # Create condensed version for the prompt
        summary_context = {
            "file_path": file_path,
            "language": language,
            "num_functions": len(parsed_code.get('functions', [])),
            "num_classes": len(parsed_code.get('classes', [])),
            "imports": parsed_code.get('imports', [])[:10],  # First 10 imports
            "complexity": parsed_code.get('complexity'),
            "total_lines": parsed_code.get('summary', {}).get('total_lines', 0)
        }
        
        # Get first 50 lines of code
        code_lines = code.split('\n')[:50]
        code_preview = '\n'.join(code_lines)
        
        prompt = f"""Analyze this {language} file and provide a comprehensive summary.

**File:** `{file_path}`

**Statistics:**
- Functions: {summary_context['num_functions']}
- Classes: {summary_context['num_classes']}
- Complexity Score: {summary_context['complexity']}
- Total Lines: {summary_context['total_lines']}

**Key Imports:**
{chr(10).join(summary_context['imports'][:5]) if summary_context['imports'] else 'None'}

**Code Preview (first 50 lines):**
```{language}
{code_preview}
```

**Provide:**

1. **File Purpose**: What is the main purpose of this file?
2. **Key Components**: Brief overview of main functions/classes
3. **Dependencies**: What external dependencies does it use?
4. **Architectural Role**: How does this fit into a larger system?
5. **Complexity Assessment**: Is this code simple, moderate, or complex?

Be concise but insightful. Format in clear markdown."""
        
        print(f"  🤖 Generating file summary")
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_model,  # Use GPT-4 for file summaries
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software engineer performing code review. "
                        "Provide insightful, actionable file summaries that help developers "
                        "quickly understand what a file does and how it fits into the codebase."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.4,
            max_tokens=1000
        )
        
        summary = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        self.total_tokens_used += tokens_used
        print(f"    Tokens used: {tokens_used}")
        
        # Cache for 24 hours
        await cache.set(cache_key, {"summary": summary}, expire=86400)
        
        return summary
    
    async def generate_inline_comments(
        self,
        code: str,
        language: str,
        parsed_info: Dict
    ) -> str:
        """
        Add helpful inline comments to complex code.
        
        Args:
            code: Source code
            language: Programming language
            parsed_info: Parsed code information
            
        Returns:
            Code with added inline comments
        """
        # Only add comments if complexity is high
        complexity = parsed_info.get('complexity', 0)
        if complexity < 5:
            print(f"  ⏭️  Skipping inline comments (low complexity: {complexity})")
            return code
        
        print(f"  🤖 Adding inline comments (complexity: {complexity})")
        
        prompt = f"""Add helpful inline comments to this {language} code.

**Guidelines:**
- Add comments for complex logic and algorithms
- Explain WHY, not WHAT (avoid obvious comments)
- Keep comments concise and clear
- Use proper comment syntax for {language}
- Don't over-comment simple code
- Focus on non-obvious behavior and edge cases

**Code:**
```{language}
{code}
```

Return ONLY the code with added comments. Do not include explanations or markdown formatting around the code."""
        
        response = await asyncio.to_thread(
            self.client.chat.completions.create,
            model=self.gpt4_mini_model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a code documentation expert. Add clear, helpful inline comments."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        commented_code = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        self.total_tokens_used += tokens_used
        print(f"    Tokens used: {tokens_used}")
        
        # Clean up markdown code blocks if present
        if commented_code.startswith('```'):
            lines = commented_code.split('\n')
            # Remove first line (```language) and last line (```)
            commented_code = '\n'.join(lines[1:-1]) if len(lines) > 2 else commented_code
        
        return commented_code
    
    def get_total_tokens_used(self) -> int:
        """Get total tokens used in this session"""
        return self.total_tokens_used
    
    def estimate_cost(self) -> float:
        """
        Estimate cost based on tokens used.
        
        Returns:
            Estimated cost in USD
        """
        # Pricing (as of 2024):
        # GPT-4o: ~$0.03 per 1K tokens
        # GPT-4o-mini: ~$0.003 per 1K tokens
        # We'll use a blended rate of ~$0.015 per 1K tokens
        cost = (self.total_tokens_used / 1000) * 0.015
        return round(cost, 4)
    
    async def generate_function_documentation_with_template(
        self,
        function_info: Dict,
        code_context: str,
        language: str,
        prompt_template: PromptTemplate
    ) -> str:
        """
        Generate documentation for a single function using a custom prompt template.
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "func_doc_template",
            function_info.get("name", ""),
            language,
            prompt_template.id
        )
        
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare the function context
        function_context = f"""
Function: {function_info.get('name', 'Unknown')}
Language: {language}
Parameters: {function_info.get('params', [])}
Return Type: {function_info.get('return_type', 'Unknown')}
Current Docstring: {function_info.get('docstring', 'None')}

Code Context:
{code_context}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt_template.system_prompt},
                    {"role": "user", "content": f"{prompt_template.function_prompt}\n\n{function_context}"}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            result = response.choices[0].message.content.strip()
            
            # Cache the result
            await cache.set(cache_key, result, expire=86400)  # 24 hours
            
            return result
            
        except Exception as e:
            print(f"Error generating function documentation: {e}")
            return f"Error generating documentation: {str(e)}"
    
    async def generate_class_documentation_with_template(
        self,
        class_info: Dict,
        code_context: str,
        language: str,
        prompt_template: PromptTemplate
    ) -> str:
        """
        Generate documentation for a class using a custom prompt template.
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "class_doc_template",
            class_info.get("name", ""),
            language,
            prompt_template.id
        )
        
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare the class context
        class_context = f"""
Class: {class_info.get('name', 'Unknown')}
Language: {language}
Methods: {class_info.get('methods', [])}
Attributes: {class_info.get('attributes', [])}
Inheritance: {class_info.get('inheritance', [])}
Current Docstring: {class_info.get('docstring', 'None')}

Code Context:
{code_context}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt_template.system_prompt},
                    {"role": "user", "content": f"{prompt_template.class_prompt}\n\n{class_context}"}
                ],
                temperature=0.7,
                max_tokens=1200
            )
            
            result = response.choices[0].message.content.strip()
            
            # Cache the result
            await cache.set(cache_key, result, expire=86400)  # 24 hours
            
            return result
            
        except Exception as e:
            print(f"Error generating class documentation: {e}")
            return f"Error generating documentation: {str(e)}"
    
    async def generate_file_summary_with_template(
        self,
        file_content: str,
        language: str,
        functions: List[Dict],
        classes: List[Dict],
        prompt_template: PromptTemplate
    ) -> str:
        """
        Generate file summary using a custom prompt template.
        """
        # Check cache first
        cache_key = cache.generate_cache_key(
            "file_summary_template",
            f"file_{hash(file_content)}",
            language,
            prompt_template.id
        )
        
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result
        
        # Prepare the file context
        file_context = f"""
File Language: {language}
Functions: {[f['name'] for f in functions]}
Classes: {[c['name'] for c in classes]}
Total Lines: {len(file_content.splitlines())}

File Content:
{file_content[:3000]}...
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt_template.system_prompt},
                    {"role": "user", "content": f"{prompt_template.file_prompt}\n\n{file_context}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            result = response.choices[0].message.content.strip()
            
            # Cache the result
            await cache.set(cache_key, result, expire=86400)  # 24 hours
            
            return result
            
        except Exception as e:
            print(f"Error generating file summary: {e}")
            return f"Error generating documentation: {str(e)}"
    
    @classmethod
    def create_with_user_api_key(cls, user_api_key: UserApiKey):
        """
        Create an AI service instance using a user's API key.
        """
        from app.services.encryption_service import get_encryption_service
        
        encryption_service = get_encryption_service()
        decrypted_key = encryption_service.decrypt(user_api_key.encrypted_key)
        
        service = cls()
        service.client = OpenAI(api_key=decrypted_key)
        service.user_api_key = user_api_key
        
        return service
    
    async def track_usage(self, tokens_used: int):
        """
        Track API usage for user's API key.
        """
        if hasattr(self, 'user_api_key') and self.user_api_key:
            # This would need to be called from the repository processing
            # where we have access to the database session
            pass
