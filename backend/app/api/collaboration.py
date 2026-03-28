import json
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, get_db
from app.core.rate_limit import limiter
from app.core.security import decode_access_token
from app.models.integrations import CollaborationSession
from app.models.user import User
from sqlalchemy import select
from app.schemas.integrations import (
    CollabNoteCreate,
    CollabSessionCreate,
    CollabSessionResponse,
)
from app.services.integrations_service import (
    add_collaboration_note,
    create_collaboration_session,
    get_collaboration_notes,
)

router = APIRouter(prefix="/collab", tags=["collaboration"])
settings = get_settings()

active_connections: dict[int, set[WebSocket]] = defaultdict(set)
presence: dict[int, set[str]] = defaultdict(set)


@router.post("/sessions", response_model=CollabSessionResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_session(
    request: Request,
    payload: CollabSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    session = await create_collaboration_session(
        db,
        user_id=current_user.id,
        repository_id=payload.repository_id,
        title=payload.title,
        saved_exploration_id=payload.saved_exploration_id,
    )
    return {
        "id": session.id,
        "repository_id": session.repository_id,
        "saved_exploration_id": session.saved_exploration_id,
        "title": session.title,
        "is_active": session.is_active,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "notes": [],
    }


@router.get("/sessions/{session_id}", response_model=CollabSessionResponse)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_session(
    request: Request,
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    session = await db.get(CollaborationSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    notes = await get_collaboration_notes(db, session_id=session_id)
    return {
        "id": session.id,
        "repository_id": session.repository_id,
        "saved_exploration_id": session.saved_exploration_id,
        "title": session.title,
        "is_active": session.is_active,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "notes": [
            {
                "id": n.id,
                "content": n.content,
                "user_id": n.user_id,
                "created_at": n.created_at,
            }
            for n in notes
        ],
    }


@router.post("/sessions/{session_id}/notes")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_note(
    request: Request,
    session_id: int,
    payload: CollabNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    session = await db.get(CollaborationSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    note = await add_collaboration_note(
        db, session_id=session_id, user_id=current_user.id, content=payload.content
    )
    message = {
        "type": "note",
        "session_id": session_id,
        "note": {
            "id": note.id,
            "content": note.content,
            "user_id": note.user_id,
            "created_at": note.created_at.isoformat() if note.created_at else None,
        },
    }
    await _broadcast(session_id, message)
    return message["note"]


async def _broadcast(session_id: int, message: dict[str, Any]) -> None:
    dead: list[WebSocket] = []
    for ws in active_connections[session_id]:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections[session_id].discard(ws)


@router.websocket("/sessions/{session_id}/stream")
async def collab_stream(websocket: WebSocket, session_id: int):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    payload = decode_access_token(token)
    username = payload.get("sub") if payload else None
    if not username:
        await websocket.close(code=4401)
        return

    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.username == username))
        user = user_result.scalar_one_or_none()
        session = await db.get(CollaborationSession, session_id)
        if not user or not session:
            await websocket.close(code=4404)
            return
        if session.user_id != user.id:
            await websocket.close(code=4403)
            return
        await websocket.accept()
        active_connections[session_id].add(websocket)
        presence[session_id].add(username)
        await _broadcast(
            session_id,
            {
                "type": "presence",
                "session_id": session_id,
                "users": sorted(list(presence[session_id])),
            },
        )
        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    data = json.loads(raw)
                except Exception:
                    data = {"type": "message", "value": raw}
                msg_type = data.get("type")
                if msg_type == "note":
                    content = str(data.get("content") or "").strip()
                    if content:
                        user_result = await db.execute(
                            select(User).where(User.username == username)
                        )
                        user = user_result.scalar_one_or_none()
                        if user:
                            note = await add_collaboration_note(
                                db, session_id=session_id, user_id=user.id, content=content
                            )
                            await _broadcast(
                                session_id,
                                {
                                    "type": "note",
                                    "session_id": session_id,
                                    "note": {
                                        "id": note.id,
                                        "content": note.content,
                                        "user_id": note.user_id,
                                        "created_at": note.created_at.isoformat()
                                        if note.created_at
                                        else None,
                                    },
                                },
                            )
                    continue
                await _broadcast(
                    session_id,
                    {"type": "event", "session_id": session_id, "user": username, "data": data},
                )
        except WebSocketDisconnect:
            pass
        finally:
            active_connections[session_id].discard(websocket)
            presence[session_id].discard(username)
            await _broadcast(
                session_id,
                {
                    "type": "presence",
                    "session_id": session_id,
                    "users": sorted(list(presence[session_id])),
                },
            )
