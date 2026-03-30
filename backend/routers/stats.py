from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend import models

router = APIRouter(prefix="/stats", tags=["Stats"])


class ChatHistoryItem(BaseModel):
    id: int
    query: str
    response: str
    confidence: int
    created_at: str


class UserStats(BaseModel):
    total_queries: int
    recent_queries: list[dict]


@router.get("/{user_id}", response_model=UserStats)
def get_user_stats(user_id: str, db: Session = Depends(get_db)):
    # Count total queries
    total = db.query(func.count(models.ChatHistory.id)).filter(
        models.ChatHistory.user_id == user_id
    ).scalar() or 0

    # Get recent queries (last 10)
    recent = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == user_id)
        .order_by(models.ChatHistory.created_at.desc())
        .limit(10)
        .all()
    )

    recent_list = [
        {
            "id": q.id,
            "query": q.query[:100],
            "response": q.response[:150] if q.response else "",
            "confidence": q.confidence or 0,
            "created_at": q.created_at.isoformat() if q.created_at else "",
        }
        for q in recent
    ]

    return UserStats(
        total_queries=total,
        recent_queries=recent_list,
    )
