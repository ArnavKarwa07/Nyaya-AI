from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    query = Column(Text)
    response = Column(Text)
    confidence = Column(Integer)
    query_type = Column(String, default="general")
    citations = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LegalSection(Base):
    __tablename__ = "legal_sections"
    __table_args__ = (
        UniqueConstraint("code", "section", name="uq_legal_code_section"),
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True, nullable=False)  # IPC or BNS
    section = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    chapter = Column(String, default="")
    ipc_equivalent = Column(String, default="")
    keywords = Column(Text, default="")
    source = Column(String, default="seed")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, unique=True, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
