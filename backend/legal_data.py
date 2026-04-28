import json
from pathlib import Path
import re
from typing import Any

from sqlalchemy.orm import Session

from backend import models

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional at import time until deps are installed
    PdfReader = None

DATA_DIR = Path(__file__).parent / "data"
PDF_SOURCE_FILE = DATA_DIR / "legal_documentation.pdf"

DATASET_CONFIG = [
    {
        "file": "ipc_sections.json",
        "code": "IPC",
        "source": "backend/data/ipc_sections.json",
    },
    {
        "file": "bns_sections.json",
        "code": "BNS",
        "source": "backend/data/bns_sections.json",
    },
    {
        "file": "constitution_articles.json",
        "code": "CONSTITUTION",
        "source": "backend/data/constitution_articles.json",
    },
    {
        "file": "evidence_act_sections.json",
        "code": "EVIDENCE_ACT",
        "source": "backend/data/evidence_act_sections.json",
    },
    {
        "file": "bnss_sections.json",
        "code": "BNSS",
        "source": "backend/data/bnss_sections.json",
    },
    {
        "file": "indian_contract_act_sections.json",
        "code": "CONTRACT_ACT",
        "source": "backend/data/indian_contract_act_sections.json",
    },
    {
        "file": "supreme_court_precedents.json",
        "code": "CASELAW",
        "source": "backend/data/supreme_court_precedents.json",
    },
    {
        "file": "bombay_amendment_sections.json",
        "code": "BOMBAY_AMENDMENT",
        "source": "backend/data/bombay_amendment_sections.json",
    },
    {
        "file": "ipc_full_sections.json",
        "code": "IPC",
        "source": "backend/data/ipc_full_sections.json",
    },
    {
        "file": "constitution_full_articles.json",
        "code": "CONSTITUTION",
        "source": "backend/data/constitution_full_articles.json",
    },
    {
        "file": "bns_full_sections.json",
        "code": "BNS",
        "source": "backend/data/bns_full_sections.json",
    },
    {
        "file": "bnss_full_sections.json",
        "code": "BNSS",
        "source": "backend/data/bnss_full_sections.json",
    },
    {
        "file": "evidence_full_sections.json",
        "code": "EVIDENCE_ACT",
        "source": "backend/data/evidence_full_sections.json",
    },
]

ACT_MARKERS: list[tuple[str, str]] = [
    ("bharatiya nyaya sanhita", "BNS"),
    ("indian penal code", "IPC"),
    ("constitution of india", "CONSTITUTION"),
    ("bharatiya nagarik suraksha sanhita", "BNSS"),
    ("code of criminal procedure", "BNSS"),
    ("indian evidence act", "EVIDENCE_ACT"),
    ("bharatiya sakshya", "EVIDENCE_ACT"),
    ("indian contract act", "CONTRACT_ACT"),
    ("bombay prohibition", "BOMBAY_AMENDMENT"),
    ("bombay police act", "BOMBAY_AMENDMENT"),
    ("bombay prevention of gambling", "BOMBAY_AMENDMENT"),
    ("mcoca", "BOMBAY_AMENDMENT"),
    ("maharashtra control of organised crime", "BOMBAY_AMENDMENT"),
    ("maharashtra rent control", "BOMBAY_AMENDMENT"),
    ("bombay amendment", "BOMBAY_AMENDMENT"),
    ("maharashtra amendment", "BOMBAY_AMENDMENT"),
    ("mpid act", "BOMBAY_AMENDMENT"),
]


def _normalize_keywords(title: str, description: str, section: str, code: str) -> str:
    base_text = f"{title} {description} {section} {code}".lower()
    tokens = []
    for raw in base_text.replace("/", " ").replace("-", " ").split():
        token = "".join(ch for ch in raw if ch.isalnum())
        if len(token) >= 4 and token not in tokens:
            tokens.append(token)
    return ",".join(tokens[:25])


def _load_json(file_name: str) -> list[dict[str, Any]]:
    path = DATA_DIR / file_name
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as fp:
        loaded = json.load(fp)
    if not isinstance(loaded, list):
        return []
    return loaded


def _get_dynamic_dataset_config() -> list[dict[str, str]]:
    dynamic: list[dict[str, str]] = []
    known_files = {entry["file"] for entry in DATASET_CONFIG}

    for path in sorted(DATA_DIR.glob("*_full_*.json")):
        if path.name in known_files:
            continue

        lowered = path.name.lower()
        code = "LEGAL_DOC"
        if "ipc" in lowered:
            code = "IPC"
        elif "constitution" in lowered:
            code = "CONSTITUTION"
        elif "bns" in lowered and "bnss" not in lowered:
            code = "BNS"
        elif "bnss" in lowered or "crpc" in lowered:
            code = "BNSS"
        elif "evidence" in lowered or "sakshya" in lowered:
            code = "EVIDENCE_ACT"
        elif "contract" in lowered:
            code = "CONTRACT_ACT"
        elif "bombay" in lowered or "mcoca" in lowered or "maharashtra" in lowered:
            code = "BOMBAY_AMENDMENT"

        dynamic.append(
            {
                "file": path.name,
                "code": code,
                "source": f"backend/data/{path.name}",
            }
        )

    return dynamic


def _split_text_chunks(text: str, chunk_size: int = 1600, overlap: int = 200) -> list[str]:
    normalized = re.sub(r"\s+", " ", text or "").strip()
    if not normalized:
        return []

    chunks: list[str] = []
    cursor = 0
    text_length = len(normalized)

    while cursor < text_length:
        end = min(cursor + chunk_size, text_length)
        chunk = normalized[cursor:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= text_length:
            break
        cursor = max(end - overlap, cursor + 1)

    return chunks


def _extract_pdf_chunks() -> list[dict[str, str]]:
    if PdfReader is None or not PDF_SOURCE_FILE.exists():
        return []

    reader = PdfReader(str(PDF_SOURCE_FILE))
    rows: list[dict[str, str]] = []

    for page_index, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        page_chunks = _split_text_chunks(page_text)
        for chunk_index, chunk in enumerate(page_chunks, start=1):
            first_line = chunk.split(".")[0][:110].strip()
            title = first_line if first_line else f"Legal Documentation Page {page_index}"
            rows.append(
                {
                    "section": f"P{page_index}-C{chunk_index}",
                    "title": title,
                    "description": chunk,
                    "chapter": f"PDF Page {page_index}",
                }
            )

    return rows


def _infer_act_code_from_text(text: str, current_code: str | None = None) -> str:
    lowered = (text or "").lower()
    for marker, code in ACT_MARKERS:
        if marker in lowered:
            return code
    return current_code or "LEGAL_DOC"


def _extract_structured_sections_from_pdf() -> list[dict[str, str]]:
    if PdfReader is None or not PDF_SOURCE_FILE.exists():
        return []

    reader = PdfReader(str(PDF_SOURCE_FILE))
    rows: list[dict[str, str]] = []
    section_pattern = re.compile(
        r"(?im)\b(section|article)\s+([0-9]+[0-9A-Za-z()\-/]*)\s*[:\-–]\s*([^\n]{3,180})"
    )

    current_code: str | None = None
    for page_index, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        if not page_text.strip():
            continue

        current_code = _infer_act_code_from_text(page_text, current_code)
        normalized_page = re.sub(r"\r\n?", "\n", page_text)
        matches = list(section_pattern.finditer(normalized_page))

        for idx, match in enumerate(matches):
            kind = match.group(1).strip().title()
            number = match.group(2).strip()
            title = match.group(3).strip(" .:-")
            start = match.end()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(normalized_page)
            description = re.sub(r"\s+", " ", normalized_page[start:end]).strip()
            if len(description) > 900:
                description = description[:900].rstrip() + "..."
            if len(description) < 30:
                description = f"{kind} {number} - {title}"

            rows.append(
                {
                    "code": current_code or "LEGAL_DOC",
                    "section": number,
                    "title": title,
                    "description": description,
                    "chapter": f"PDF Page {page_index}",
                    "source": "backend/data/legal_documentation.pdf",
                }
            )

    return rows


def seed_legal_sections(db: Session) -> int:
    existing_rows = db.query(models.LegalSection.code, models.LegalSection.section).all()
    existing_keys = {(str(code), str(section)) for code, section in existing_rows}

    entries: list[models.LegalSection] = []

    all_datasets = [*DATASET_CONFIG, *_get_dynamic_dataset_config()]
    for dataset in all_datasets:
        items = _load_json(dataset["file"])
        for item in items:
            section = str(item.get("section", "")).strip()
            title = str(item.get("title", "")).strip()
            description = str(item.get("description", "")).strip()
            chapter = str(item.get("chapter", "")).strip()
            ipc_equivalent = str(item.get("ipc_equivalent", "")).strip()
            code = str(dataset["code"])

            if not section or not title or not description:
                continue

            key = (code, section)
            if key in existing_keys:
                continue

            entries.append(
                models.LegalSection(
                    code=code,
                    section=section,
                    title=title,
                    description=description,
                    chapter=chapter,
                    ipc_equivalent=ipc_equivalent,
                    keywords=_normalize_keywords(title, description, section, code),
                    source=str(dataset["source"]),
                )
            )
            existing_keys.add(key)

    structured_pdf_rows = _extract_structured_sections_from_pdf()
    for row in structured_pdf_rows:
        section = row["section"]
        title = row["title"]
        description = row["description"]
        chapter = row["chapter"]
        code = row["code"]
        source = row["source"]
        key = (code, section)
        if key in existing_keys:
            continue

        entries.append(
            models.LegalSection(
                code=code,
                section=section,
                title=title,
                description=description,
                chapter=chapter,
                keywords=_normalize_keywords(title, description, section, code),
                source=source,
            )
        )
        existing_keys.add(key)

    pdf_rows = _extract_pdf_chunks()
    for row in pdf_rows:
        section = row["section"]
        title = row["title"]
        description = row["description"]
        chapter = row["chapter"]
        code = "LEGAL_DOC"
        key = (code, section)
        if key in existing_keys:
            continue

        entries.append(
            models.LegalSection(
                code=code,
                section=section,
                title=title,
                description=description,
                chapter=chapter,
                keywords=_normalize_keywords(title, description, section, code),
                source="backend/data/legal_documentation.pdf",
            )
        )
        existing_keys.add(key)

    if entries:
        db.add_all(entries)
        db.commit()
    return len(entries)
