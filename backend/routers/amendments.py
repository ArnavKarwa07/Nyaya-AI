from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter(prefix="/amendments", tags=["Amendments"])


class AmendmentCompareRequest(BaseModel):
    old_text: str
    new_text: str
    document_title: str = "Legal Document"


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
def compare_amendments(request: AmendmentCompareRequest):
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    model = genai.GenerativeModel(model_name)

    prompt = f"""You are an expert Indian legal amendment analyst.
Compare these two versions of a legal document and identify all amendments, changes, additions, and deletions.

DOCUMENT: {request.document_title}

OLD VERSION:
{request.old_text}

NEW VERSION:
{request.new_text}

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
        result = model.generate_content(prompt)
        text = result.text

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
                    "old_content": request.old_text[:100],
                    "new_content": request.new_text[:100],
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
