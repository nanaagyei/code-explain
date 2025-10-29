"""
Chat API endpoints for AI-powered Q&A.

Provides streaming responses for real-time typewriter effect.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json

from app.api.auth import get_current_user
from app.models.user import User
from app.services.chat_service import get_chat_service


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    """Chat request model"""
    message: str
    context: Optional[str] = None


class QuickExplainRequest(BaseModel):
    """Quick code explanation request"""
    code: str


class FunctionDocRequest(BaseModel):
    """Function documentation request"""
    code: str
    name: str


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stream AI chat response with Server-Sent Events.
    
    Returns streaming response for typewriter effect.
    """
    chat_service = get_chat_service()
    
    async def event_generator():
        """Generate Server-Sent Events"""
        try:
            async for chunk in chat_service.answer_question(
                request.message,
                request.context
            ):
                # Send as Server-Sent Event
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            # Send error
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.post("/explain")
async def explain_code(
    request: QuickExplainRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stream explanation of code snippet.
    
    Returns streaming response.
    """
    chat_service = get_chat_service()
    
    async def event_generator():
        """Generate Server-Sent Events"""
        try:
            async for chunk in chat_service.quick_explain(request.code):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/document")
async def document_function(
    request: FunctionDocRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Stream documentation for a function.
    
    Returns streaming response.
    """
    chat_service = get_chat_service()
    
    async def event_generator():
        """Generate Server-Sent Events"""
        try:
            async for chunk in chat_service.document_function(
                request.code,
                request.name
            ):
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

