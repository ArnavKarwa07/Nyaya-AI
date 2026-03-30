from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os

router = APIRouter(prefix="/summarize", tags=["Summarize"])


class SummarizeRequest(BaseModel):
    document_text: str


class SummarizeResponse(BaseModel):
    summary: str
    sections: list[dict]
    confidence: int


@router.post("/", response_model=SummarizeResponse)
def summarize_document(request: SummarizeRequest):
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    model = genai.GenerativeModel(model_name)

    prompt = f"""You are an expert Indian legal document summarizer.
Analyze the following legal text and provide a hierarchical summary.

DOCUMENT TEXT:
{request.document_text}

Format your response EXACTLY as follows:
CONFIDENCE: [Score 0-100]
SUMMARY:
[Overall 2-3 sentence summary]
SECTIONS:
- TITLE: [Section title]
  CONTENT: [Section summary]
- TITLE: [Section title]
  CONTENT: [Section summary]
"""

    try:
        result = model.generate_content(prompt)
        text = result.text

        confidence = 85
        summary = text
        sections = []

        if "CONFIDENCE:" in text:
            try:
                conf_str = text.split("CONFIDENCE:")[1].split("\n")[0].strip()
                confidence = int(conf_str)
            except (ValueError, IndexError):
                pass

        if "SUMMARY:" in text and "SECTIONS:" in text:
            summary = (
                text.split("SUMMARY:")[1].split("SECTIONS:")[0].strip()
            )
            sections_text = text.split("SECTIONS:")[1]

            if "TITLE:" in sections_text:
                section_parts = sections_text.split("TITLE:")[1:]
                for part in section_parts:
                    try:
                        lines = part.strip().split("\n")
                        title = lines[0].strip()
                        content = ""
                        for line in lines[1:]:
                            line = line.strip().lstrip("- ")
                            if line.startswith("CONTENT:"):
                                content = line.split("CONTENT:")[1].strip()
                                break
                        sections.append({"title": title, "content": content or title})
                    except (IndexError, ValueError):
                        continue

        if not sections:
            sections = [{"title": "Full Document", "content": summary[:300]}]

        return SummarizeResponse(
            summary=summary, sections=sections, confidence=confidence
        )
    except Exception as e:
        return SummarizeResponse(
            summary=f"Error generating summary: {str(e)}",
            sections=[],
            confidence=0,
        )
