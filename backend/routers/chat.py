from typing import Optional

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
from backend.routers.documents import extract_document_text

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
    document_ids: Optional[list[int]] = None


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

    # Extract text from attached documents to prepend as extra context
    doc_context = ""
    if req.document_ids:
        doc_texts = []
        for doc_id in req.document_ids[:3]:  # Limit to 3 documents
            try:
                text = extract_document_text(db, doc_id, current_user)
                if text:
                    doc_texts.append(f"[Attached Document {doc_id}]:\n{text[:8000]}")
            except Exception:
                pass
        if doc_texts:
            doc_context = "\n\n".join(doc_texts)

    try:
        rag_result = run_rag_chat(db, current_user, req.query, llm, doc_context=doc_context)
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
@router.get("/history")
def get_chat_history(
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request
    chats = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == current_user)
        .order_by(models.ChatHistory.created_at.desc())
        .limit(50)
        .all()
    )
    
    result = []
    for q in chats:
        result.append({
            "id": q.id,
            "query": q.query,
            "response": q.response,
            "confidence": q.confidence,
            "citations": q.citations.split(",") if q.citations else [],
            "created_at": q.created_at.isoformat() if q.created_at else "",
            "query_type": q.query_type
        })
    return {"history": result}
