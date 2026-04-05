from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_startup_migrations() -> None:
    if "sqlite" not in SQLALCHEMY_DATABASE_URL:
        return

    with engine.begin() as conn:
        columns = conn.execute(text("PRAGMA table_info(chat_history)")).fetchall()
        existing_col_names = {str(row[1]) for row in columns}

        if columns and "query_type" not in existing_col_names:
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN query_type VARCHAR DEFAULT 'general'"))
        if columns and "citations" not in existing_col_names:
            conn.execute(text("ALTER TABLE chat_history ADD COLUMN citations TEXT DEFAULT ''"))

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS user_documents (
                    id INTEGER PRIMARY KEY,
                    user_id VARCHAR NOT NULL,
                    title VARCHAR NOT NULL,
                    original_filename VARCHAR NOT NULL,
                    stored_filename VARCHAR NOT NULL UNIQUE,
                    file_size INTEGER NOT NULL,
                    mime_type VARCHAR NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
