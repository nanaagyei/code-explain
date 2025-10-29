"""
AI Chat Service for quick code documentation and Q&A.

Provides streaming responses for real-time typewriter effect.
"""
from openai import AsyncOpenAI
from typing import AsyncGenerator
import os


class ChatService:
    """Service for AI chat interactions"""
    
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Try to get from app settings as fallback
            from app.core.config import get_settings
            settings = get_settings()
            api_key = settings.openai_api_key
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment or settings")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4-turbo-preview"  # or gpt-3.5-turbo for lower cost
    
    async def stream_chat_response(
        self,
        message: str,
        context: str | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat response with typewriter effect.
        
        Args:
            message: User's question/message
            context: Optional code context for better answers
            
        Yields:
            Chunks of response text for streaming
        """
        # Build system prompt
        system_prompt = """You are CodeExplain AI, an expert code documentation assistant.

Your role is to:
- Answer questions about code structure, patterns, and best practices
- Explain complex code concepts in simple terms
- Provide documentation insights
- Help developers understand codebases quickly

Be concise, friendly, and technical when needed. Use emojis occasionally to keep responses engaging."""

        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add context if provided
        if context:
            messages.append({
                "role": "system",
                "content": f"Code context:\n```\n{context}\n```"
            })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        try:
            # Stream response from OpenAI
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=500
            )
            
            # Yield chunks as they arrive
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
    
    async def quick_explain(self, code_snippet: str) -> AsyncGenerator[str, None]:
        """
        Quick explanation of a code snippet.
        
        Args:
            code_snippet: Code to explain
            
        Yields:
            Explanation chunks
        """
        prompt = f"""Explain this code snippet in a concise, friendly way:

```
{code_snippet}
```

Focus on:
- What it does
- Key concepts
- Potential improvements"""

        async for chunk in self.stream_chat_response(prompt):
            yield chunk
    
    async def document_function(
        self,
        function_code: str,
        function_name: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate documentation for a function on-demand.
        
        Args:
            function_code: Function source code
            function_name: Name of the function
            
        Yields:
            Documentation chunks
        """
        prompt = f"""Generate concise documentation for this function:

Function name: {function_name}

```
{function_code}
```

Include:
- Purpose
- Parameters
- Return value
- Example usage if helpful"""

        async for chunk in self.stream_chat_response(prompt):
            yield chunk
    
    async def answer_question(
        self,
        question: str,
        repository_context: str | None = None
    ) -> AsyncGenerator[str, None]:
        """
        Answer a question about code or documentation.
        
        Args:
            question: User's question
            repository_context: Optional repository information
            
        Yields:
            Answer chunks
        """
        async for chunk in self.stream_chat_response(question, repository_context):
            yield chunk


# Global instance
_chat_service = None

def get_chat_service() -> ChatService:
    """Get or create global chat service instance"""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service

