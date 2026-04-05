from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from langchain_groq import ChatGroq
import os

from backend.database import get_db
from backend import models
from backend.rate_limit import limiter
from backend.rag_graph import run_rag_chat
from backend.security import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


def _infer_query_type(query: str) -> str:
    query_lower = query.lower()
    if "amend" in query_lower or "difference" in query_lower:
        return "amendment"
    if "conflict" in query_lower or "contradict" in query_lower:
        return "conflict"
    if "summary" in query_lower or "summar" in query_lower:
        return "summarization"
    return "qa"


class ChatRequest(BaseModel):
    query: str = Field(min_length=4, max_length=4000)


class ChatResponse(BaseModel):
    response: str
    confidence: int
    citations: list[str] = []


@router.post("/", response_model=ChatResponse)
@limiter.limit("30/minute")
def handle_legal_chat(
    request: Request,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
        api_key=os.getenv("GROQ_API_KEY", ""),
    )

    try:
        rag_result = run_rag_chat(db, current_user, req.query, llm)
        response_text = str(rag_result.get("response", "")).strip()
        confidence = int(rag_result.get("confidence", 0))
        citations = list(rag_result.get("citations", []))

        # Save to chat history
        chat_entry = models.ChatHistory(
            user_id=current_user,
            query=req.query,
            response=response_text,
            confidence=confidence,
            query_type=_infer_query_type(req.query),
            citations=",".join(citations),
        )
        db.add(chat_entry)
        db.commit()

        return ChatResponse(response=response_text, confidence=confidence, citations=citations)
    except Exception as e:
        return ChatResponse(response=f"Error: {str(e)}", confidence=0, citations=[])
