from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
import os

from backend.rate_limit import limiter
from backend.security import get_current_user

router = APIRouter(prefix="/amendments", tags=["Amendments"])


class AmendmentCompareRequest(BaseModel):
    old_text: str = Field(min_length=20, max_length=25000)
    new_text: str = Field(min_length=20, max_length=25000)
    document_title: str = Field(default="Legal Document", min_length=3, max_length=200)


class AmendmentChange(BaseModel):
    clause: str
    change_type: str
    old_content: str
    new_content: str
    risk_level: str
    impact_analysis: str


class AmendmentCompareResponse(BaseModel):
    changes: list[dict]
    total_additions: int
    total_deletions: int
    risk_summary: str
    ai_impact_analysis: str
    confidence: int


@router.post("/compare", response_model=AmendmentCompareResponse)
@limiter.limit("16/minute")
def compare_amendments(
    request: Request,
    payload: AmendmentCompareRequest,
    current_user: str = Depends(get_current_user),
):
    _ = (request, current_user)
    llm = ChatGroq(
        model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
        api_key=os.getenv("GROQ_API_KEY", ""),
    )

    prompt = f"""You are an expert Indian legal amendment analyst.
Compare these two versions of a legal document and identify all amendments, changes, additions, and deletions.

DOCUMENT: {payload.document_title}

OLD VERSION:
{payload.old_text}

NEW VERSION:
{payload.new_text}

Format your response EXACTLY as follows:
CONFIDENCE: [Score 0-100]
ADDITIONS: [number]
DELETIONS: [number]
RISK_SUMMARY: [One sentence risk assessment]
CHANGES:
- CLAUSE: [Clause reference]
  TYPE: [Addition/Deletion/Modification]
  OLD: [Old text or N/A]
  NEW: [New text or N/A]
  RISK: [High Risk/Medium Risk/Low Risk]
  IMPACT: [Impact description]
ANALYSIS:
[Detailed impact analysis paragraph]
"""

    try:
        result = llm.invoke([HumanMessage(content=prompt)])
        text = result.content

        confidence = 85
        additions = 0
        deletions = 0
        risk_summary = "Analysis complete"
        analysis = text
        changes = []

        if "CONFIDENCE:" in text:
            try:
                conf_str = text.split("CONFIDENCE:")[1].split("\n")[0].strip()
                confidence = int(conf_str)
            except (ValueError, IndexError):
                pass

        if "ADDITIONS:" in text:
            try:
                additions = int(
                    text.split("ADDITIONS:")[1].split("\n")[0].strip()
                )
            except (ValueError, IndexError):
                pass

        if "DELETIONS:" in text:
            try:
                deletions = int(
                    text.split("DELETIONS:")[1].split("\n")[0].strip()
                )
            except (ValueError, IndexError):
                pass

        if "RISK_SUMMARY:" in text:
            try:
                risk_summary = (
                    text.split("RISK_SUMMARY:")[1].split("\n")[0].strip()
                )
            except (IndexError):
                pass

        if "ANALYSIS:" in text:
            analysis = text.split("ANALYSIS:")[-1].strip()

        if "CLAUSE:" in text:
            clause_sections = text.split("CLAUSE:")[1:]
            for section in clause_sections:
                try:
                    lines = section.strip().split("\n")
                    change = {
                        "clause": lines[0].strip(),
                        "change_type": "Modification",
                        "old_content": "",
                        "new_content": "",
                        "risk_level": "Medium Risk",
                        "impact_analysis": "",
                    }
                    for line in lines:
                        line = line.strip().lstrip("- ")
                        if line.startswith("TYPE:"):
                            change["change_type"] = line.split("TYPE:")[1].strip()
                        elif line.startswith("OLD:"):
                            change["old_content"] = line.split("OLD:")[1].strip()
                        elif line.startswith("NEW:"):
                            change["new_content"] = line.split("NEW:")[1].strip()
                        elif line.startswith("RISK:"):
                            change["risk_level"] = line.split("RISK:")[1].strip()
                        elif line.startswith("IMPACT:"):
                            change["impact_analysis"] = (
                                line.split("IMPACT:")[1].strip()
                            )
                    changes.append(change)
                except (IndexError, ValueError):
                    continue

        if not changes:
            changes = [
                {
                    "clause": "General",
                    "change_type": "Modification",
                    "old_content": payload.old_text[:100],
                    "new_content": payload.new_text[:100],
                    "risk_level": "Medium Risk",
                    "impact_analysis": analysis[:200],
                }
            ]

        return AmendmentCompareResponse(
            changes=changes,
            total_additions=additions,
            total_deletions=deletions,
            risk_summary=risk_summary,
            ai_impact_analysis=analysis,
            confidence=confidence,
        )
    except Exception as e:
        return AmendmentCompareResponse(
            changes=[],
            total_additions=0,
            total_deletions=0,
            risk_summary=f"Error: {str(e)}",
            ai_impact_analysis=f"Error during amendment analysis: {str(e)}",
            confidence=0,
        )
