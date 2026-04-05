import os
import uuid
from pathlib import Path

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