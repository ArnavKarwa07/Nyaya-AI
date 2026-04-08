import os
import re
import uuid
from pathlib import Path

from pypdf import PdfReader

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend import models
from backend.database import get_db
from backend.rate_limit import limiter
from backend.security import get_current_user


router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_ROOT = Path(os.getenv("DOCUMENTS_UPLOAD_DIR", "backend/uploads")).resolve()
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
MAX_PDF_BYTES = 20 * 1024 * 1024


class DocumentItem(BaseModel):
    id: int
    title: str
    original_filename: str
    file_size: int
    created_at: str


class DocumentListResponse(BaseModel):
    documents: list[DocumentItem]


class DocumentUploadResponse(BaseModel):
    id: int
    title: str
    message: str


@router.post("/upload", response_model=DocumentUploadResponse)
@limiter.limit("20/hour")
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(""),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request

    safe_title = title.strip()
    if len(safe_title) > 200:
        raise HTTPException(status_code=400, detail="Title must be at most 200 characters")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    filename = file.filename.strip()
    ext = Path(filename).suffix.lower()
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content_type = (file.content_type or "").lower()
    if content_type and "pdf" not in content_type:
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF")

    try:
        file.file.seek(0, os.SEEK_END)
        size_bytes = int(file.file.tell())
        file.file.seek(0)
    except OSError as exc:
        raise HTTPException(status_code=400, detail="Could not inspect uploaded file") from exc

    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if size_bytes > MAX_PDF_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds 20MB upload limit")

    stored_name = f"{uuid.uuid4().hex}.pdf"
    stored_path = UPLOAD_ROOT / stored_name
    with stored_path.open("wb") as target:
        target.write(file.file.read())

    doc = models.UserDocument(
        user_id=current_user,
        title=safe_title or Path(filename).stem,
        original_filename=filename,
        stored_filename=stored_name,
        file_size=size_bytes,
        mime_type="application/pdf",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentUploadResponse(id=doc.id, title=doc.title, message="Document uploaded successfully")


@router.get("/", response_model=DocumentListResponse)
@limiter.limit("120/minute")
def list_documents(
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request
    rows = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.user_id == current_user)
        .order_by(models.UserDocument.created_at.desc())
        .all()
    )

    return DocumentListResponse(
        documents=[
            DocumentItem(
                id=row.id,
                title=row.title,
                original_filename=row.original_filename,
                file_size=row.file_size,
                created_at=row.created_at.isoformat() if row.created_at else "",
            )
            for row in rows
        ]
    )


@router.get("/{document_id}/content")
@limiter.limit("120/minute")
def get_document_content(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request
    row = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.id == document_id, models.UserDocument.user_id == current_user)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    stored_path = (UPLOAD_ROOT / row.stored_filename).resolve()
    if not stored_path.exists() or stored_path.parent != UPLOAD_ROOT:
        raise HTTPException(status_code=404, detail="Stored file missing")

    return FileResponse(
        path=stored_path,
        media_type="application/pdf",
        filename=row.original_filename,
        headers={"Content-Disposition": f'inline; filename="{row.original_filename}"'},
    )


def extract_document_text(db: Session, document_id: int, user_id: str) -> str:
    """Helper: extract full plain text from a user's uploaded PDF. Raises HTTPException on failure."""
    row = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.id == document_id, models.UserDocument.user_id == user_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")

    stored_path = (UPLOAD_ROOT / row.stored_filename).resolve()
    if not stored_path.exists() or stored_path.parent != UPLOAD_ROOT:
        raise HTTPException(status_code=404, detail="Stored file missing")

    try:
        reader = PdfReader(str(stored_path))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(pages_text).strip()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {exc}") from exc


class DocumentTextResponse(BaseModel):
    text: str
    title: str
    page_count: int


@router.get("/{document_id}/text", response_model=DocumentTextResponse)
@limiter.limit("60/minute")
def get_document_text(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    _ = request
    row = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.id == document_id, models.UserDocument.user_id == current_user)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    stored_path = (UPLOAD_ROOT / row.stored_filename).resolve()
    if not stored_path.exists() or stored_path.parent != UPLOAD_ROOT:
        raise HTTPException(status_code=404, detail="Stored file missing")

    try:
        reader = PdfReader(str(stored_path))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        full_text = "\n\n".join(pages_text).strip()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {exc}") from exc

    return DocumentTextResponse(
        text=full_text,
        title=row.title,
        page_count=len(reader.pages),
    )


# ---------------------------------------------------------------------------
# Clause / Section extraction
# ---------------------------------------------------------------------------

# Regex patterns that commonly start a new clause in Indian legal documents.
# Order matters: more specific patterns first.
_CLAUSE_PATTERNS = [
    # "Section 302." or "Section 302 -" or "Section 302:"
    r"(?:^|\n)\s*(Section\s+\d+[A-Za-z]?\s*[\.\-\:\)])",
    # "Article 21." / "Article 14"
    r"(?:^|\n)\s*(Article\s+\d+[A-Za-z]?\s*[\.\-\:\)]?)",
    # "Clause 3" / "Clause (a)"
    r"(?:^|\n)\s*(Clause\s+[\d\(\)A-Za-z]+\s*[\.\-\:\)]?)",
    # "Rule 5" / "Rule 12A"
    r"(?:^|\n)\s*(Rule\s+\d+[A-Za-z]?\s*[\.\-\:\)]?)",
    # "Chapter IV" / "Chapter 3" / "CHAPTER III"
    r"(?:^|\n)\s*(CHAPTER\s+[IVXLCDM\d]+\s*[\.\-\:\)]?)",
    r"(?:^|\n)\s*(Chapter\s+[IVXLCDM\d]+\s*[\.\-\:\)]?)",
    # "Part II" / "PART III"
    r"(?:^|\n)\s*((?:PART|Part)\s+[IVXLCDM\d]+\s*[\.\-\:\)]?)",
    # "Schedule I" / "SCHEDULE"
    r"(?:^|\n)\s*((?:SCHEDULE|Schedule)\s*[IVXLCDM\d]*\s*[\.\-\:\)]?)",
    # Numbered headings like "1." "12." "3.1" at start of line
    r"(?:^|\n)\s*(\d+(?:\.\d+)?\s*[\.\)]\s+[A-Z])",
]

_COMBINED_PATTERN = re.compile("|".join(_CLAUSE_PATTERNS), re.MULTILINE | re.IGNORECASE)


def _extract_clauses(full_text: str) -> list[dict]:
    """Split full_text into clause dicts: {id, title, body}."""
    matches = list(_COMBINED_PATTERN.finditer(full_text))

    if not matches:
        # Fall back: split by double-newline paragraphs
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", full_text) if p.strip()]
        results = []
        for idx, para in enumerate(paragraphs, 1):
            first_line = para.split("\n")[0][:120]
            results.append({
                "id": idx,
                "title": first_line,
                "body": para,
            })
        return results[:200]  # cap to avoid huge payloads

    clauses: list[dict] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        chunk = full_text[start:end].strip()

        # First line becomes the title
        lines = chunk.split("\n")
        title = lines[0].strip()[:200]
        body = chunk

        clauses.append({
            "id": i + 1,
            "title": title,
            "body": body,
        })

    return clauses[:200]


class ClauseItem(BaseModel):
    id: int
    title: str
    body: str


class ClausesResponse(BaseModel):
    clauses: list[ClauseItem]
    document_title: str
    total: int


@router.get("/{document_id}/clauses", response_model=ClausesResponse)
@limiter.limit("60/minute")
def get_document_clauses(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """Extract individual clauses/sections from a user's uploaded PDF."""
    _ = request
    row = (
        db.query(models.UserDocument)
        .filter(models.UserDocument.id == document_id, models.UserDocument.user_id == current_user)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")

    stored_path = (UPLOAD_ROOT / row.stored_filename).resolve()
    if not stored_path.exists() or stored_path.parent != UPLOAD_ROOT:
        raise HTTPException(status_code=404, detail="Stored file missing")

    try:
        reader = PdfReader(str(stored_path))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        full_text = "\n\n".join(pages_text).strip()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {exc}") from exc

    clauses = _extract_clauses(full_text)

    return ClausesResponse(
        clauses=[ClauseItem(**c) for c in clauses],
        document_title=row.title,
        total=len(clauses),
    )