from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json
from pathlib import Path

from backend.database import get_db
from backend import models

router = APIRouter(prefix="/chat", tags=["Chat"])

# Load legal data at startup for context injection
DATA_DIR = Path(__file__).parent.parent / "data"

_ipc_sections = []
_bns_sections = []

try:
    with open(DATA_DIR / "ipc_sections.json", "r", encoding="utf-8") as f:
        _ipc_sections = json.load(f)
except FileNotFoundError:
    pass

try:
    with open(DATA_DIR / "bns_sections.json", "r", encoding="utf-8") as f:
        _bns_sections = json.load(f)
except FileNotFoundError:
    pass


def _build_legal_context(query: str) -> str:
    """Search IPC/BNS data for sections relevant to the user query."""
    query_lower = query.lower()
    context_parts = []

    # Search IPC sections
    for s in _ipc_sections:
        if (
            s["section"].lower() in query_lower
            or s["title"].lower() in query_lower
            or any(word in query_lower for word in s["title"].lower().split() if len(word) > 4)
        ):
            context_parts.append(
                f"IPC Section {s['section']} - {s['title']}: {s['description']}"
            )

    # Search BNS sections
    for s in _bns_sections:
        if (
            f"bns" in query_lower
            or s["section"].lower() in query_lower
            or s["title"].lower() in query_lower
            or (s.get("ipc_equivalent", "") and any(eq.strip() in query_lower for eq in s.get("ipc_equivalent", "").split("/")))
            or any(word in query_lower for word in s["title"].lower().split() if len(word) > 4)
        ):
            ipc_ref = f" (IPC equivalent: S.{s['ipc_equivalent']})" if s.get("ipc_equivalent") else ""
            context_parts.append(
                f"BNS Section {s['section']} - {s['title']}{ipc_ref}: {s['description']}"
            )

    if context_parts:
        return "\n\nRELEVANT LEGAL PROVISIONS FROM DATABASE:\n" + "\n".join(context_parts[:10])
    return ""


class ChatRequest(BaseModel):
    query: str
    user_id: str


class ChatResponse(BaseModel):
    response: str
    confidence: int


@router.post("/", response_model=ChatResponse)
def handle_legal_chat(request: ChatRequest, db: Session = Depends(get_db)):
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    model = genai.GenerativeModel(model_name)

    # Build legal context from local data
    legal_context = _build_legal_context(request.query)

    prompt = f"""
    You are the Digital Jurist for Indian Law. You must provide precise, authoritative answers referencing Indian laws, specifically the IPC, BNS, and Supreme Court precedents.
    Always cite specific sections, case law, and legal principles.
    If the user's question is ambiguous, ask for clarification.
    If the question is outside your expertise, say so.
    Be thorough but concise. Use numbered or bulleted lists for clarity.
    {legal_context}

    User Query: {request.query}

    Provide your response with specific legal references.
    """

    try:
        result = model.generate_content(prompt)
        response_text = result.text
        confidence = 92

        # Save to chat history
        chat_entry = models.ChatHistory(
            user_id=request.user_id,
            query=request.query,
            response=response_text,
            confidence=confidence
        )
        db.add(chat_entry)
        db.commit()

        return ChatResponse(response=response_text, confidence=confidence)
    except Exception as e:
        return ChatResponse(response=f"Error: {str(e)}", confidence=0)
