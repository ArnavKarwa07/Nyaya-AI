from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend import models
from backend.legal_data import seed_legal_sections
from backend.rate_limit import limiter
from backend.security import get_current_user

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
    average_confidence: float
    query_types: dict[str, int]


class SeedResponse(BaseModel):
    inserted_records: int


@router.get("/me", response_model=UserStats)
def get_user_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    user_id = current_user
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
            "query_type": q.query_type or "general",
            "created_at": q.created_at.isoformat() if q.created_at else "",
        }
        for q in recent
    ]

    avg_confidence = (
        db.query(func.avg(models.ChatHistory.confidence))
        .filter(models.ChatHistory.user_id == user_id)
        .scalar()
        or 0
    )

    type_rows = (
        db.query(models.ChatHistory.query_type, func.count(models.ChatHistory.id))
        .filter(models.ChatHistory.user_id == user_id)
        .group_by(models.ChatHistory.query_type)
        .all()
    )
    query_types = {str(row[0] or "general"): int(row[1]) for row in type_rows}

    return UserStats(
        total_queries=total,
        recent_queries=recent_list,
        average_confidence=round(float(avg_confidence), 2),
        query_types=query_types,
    )


@router.post("/seed/reindex", response_model=SeedResponse)
def reseed_legal_corpus(
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = (request, current_user)
    inserted = seed_legal_sections(db)
    return SeedResponse(inserted_records=inserted)
