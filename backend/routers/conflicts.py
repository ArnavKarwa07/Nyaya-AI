from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
import os

from backend.database import get_db
from backend.rate_limit import limiter
from backend.security import get_current_user
from backend.routers.documents import extract_document_text

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])


class ConflictRequest(BaseModel):
    source_text: str = Field(default="", max_length=12000)
    target_text: str = Field(default="", max_length=12000)
    source_document_id: Optional[int] = None
    target_document_id: Optional[int] = None


class ConflictItem(BaseModel):
    severity: str
    match: int
    title: str
    description: str
    source: str
    target: str


class ConflictResponse(BaseModel):
    conflicts: list[dict]
    overall_confidence: float
    ai_analysis: str


@router.post("/", response_model=ConflictResponse)
@limiter.limit("20/minute")
def detect_conflicts(
    request: Request,
    payload: ConflictRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request

    # Resolve document text when document IDs are provided
    source_text = payload.source_text
    target_text = payload.target_text

    if payload.source_document_id is not None:
        source_text = extract_document_text(db, payload.source_document_id, current_user)
    if payload.target_document_id is not None:
        target_text = extract_document_text(db, payload.target_document_id, current_user)

    if len(source_text.strip()) < 20 or len(target_text.strip()) < 20:
        return ConflictResponse(
            conflicts=[{
                "severity": "Error",
                "match": 0,
                "title": "Insufficient Text",
                "description": "Both source and target must have at least 20 characters of text.",
                "source": "",
                "target": "",
            }],
            overall_confidence=0,
            ai_analysis="Please provide longer text or select documents with more content.",
        )

    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
        api_key=os.getenv("GROQ_API_KEY", ""),
    )

    prompt = f"""You are a legal conflict detection engine specializing in Indian law.
Compare these two legal texts and identify contradictions, conflicts, or misalignments.

SOURCE TEXT:
{source_text[:12000]}

TARGET TEXT:
{target_text[:12000]}

Analyze for:
1. Terminology shifts without scope parity
2. Contradictory provisions
3. Procedural misalignments
4. Definitional divergences

Format your response EXACTLY as follows:
CONFIDENCE: [Overall confidence score 0-100]
CONFLICTS:
- SEVERITY: [High Risk/Medium Risk/Low Risk]
  MATCH: [Match percentage 0-100]
  TITLE: [Short title]
  DESCRIPTION: [Brief description of the conflict]
  SOURCE: [Source reference]
  TARGET: [Target reference]
ANALYSIS:
[Detailed comparative analysis paragraph]
"""

    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        text = result.content

        # Parse response
        confidence = 85.0
        analysis = text
        conflicts = []

        if "CONFIDENCE:" in text:
            try:
                conf_str = text.split("CONFIDENCE:")[1].split("\n")[0].strip()
                confidence = float(conf_str)
            except (ValueError, IndexError):
                pass

        if "ANALYSIS:" in text:
            analysis = text.split("ANALYSIS:")[-1].strip()

        # Extract conflicts
        if "SEVERITY:" in text:
            conflict_sections = text.split("SEVERITY:")[1:]
            for section in conflict_sections:
                try:
                    lines = section.strip().split("\n")
                    severity = lines[0].strip().rstrip(",")
                    conflict = {
                        "severity": severity,
                        "match": 80,
                        "title": "Detected Conflict",
                        "description": "",
                        "source": source_text[:50],
                        "target": target_text[:50],
                    }
                    for line in lines:
                        line = line.strip().lstrip("- ")
                        if line.startswith("MATCH:"):
                            try:
                                conflict["match"] = int(
                                    line.split("MATCH:")[1].strip().rstrip("%")
                                )
                            except ValueError:
                                pass
                        elif line.startswith("TITLE:"):
                            conflict["title"] = line.split("TITLE:")[1].strip()
                        elif line.startswith("DESCRIPTION:"):
                            conflict["description"] = line.split("DESCRIPTION:")[
                                1
                            ].strip()
                        elif line.startswith("SOURCE:"):
                            conflict["source"] = line.split("SOURCE:")[1].strip()
                        elif line.startswith("TARGET:"):
                            conflict["target"] = line.split("TARGET:")[1].strip()
                    conflicts.append(conflict)
                except (IndexError, ValueError):
                    continue

        if not conflicts:
            conflicts = [
                {
                    "severity": "Info",
                    "match": 0,
                    "title": "Analysis Complete",
                    "description": analysis[:200],
                    "source": source_text[:50],
                    "target": target_text[:50],
                }
            ]

        return ConflictResponse(
            conflicts=conflicts,
            overall_confidence=confidence,
            ai_analysis=analysis,
        )
    except Exception as e:
        return ConflictResponse(
            conflicts=[
                {
                    "severity": "Error",
                    "match": 0,
                    "title": "Analysis Failed",
                    "description": str(e),
                    "source": source_text[:50],
                    "target": target_text[:50],
                }
            ],
            overall_confidence=0,
            ai_analysis=f"Error during conflict analysis: {str(e)}",
        )
