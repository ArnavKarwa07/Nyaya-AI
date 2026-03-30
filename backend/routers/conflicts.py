from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter(prefix="/conflicts", tags=["Conflicts"])


class ConflictRequest(BaseModel):
    source_text: str
    target_text: str


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
def detect_conflicts(request: ConflictRequest):
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    model = genai.GenerativeModel(model_name)

    prompt = f"""You are a legal conflict detection engine specializing in Indian law.
Compare these two legal texts and identify contradictions, conflicts, or misalignments.

SOURCE TEXT:
{request.source_text}

TARGET TEXT:
{request.target_text}

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
        result = model.generate_content(prompt)
        text = result.text

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
                        "source": request.source_text[:50],
                        "target": request.target_text[:50],
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
                    "source": request.source_text[:50],
                    "target": request.target_text[:50],
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
                    "source": request.source_text[:50],
                    "target": request.target_text[:50],
                }
            ],
            overall_confidence=0,
            ai_analysis=f"Error during conflict analysis: {str(e)}",
        )
