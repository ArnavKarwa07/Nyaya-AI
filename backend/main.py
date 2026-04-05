from fastapi import FastAPI
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler

from backend import models
from backend.database import SessionLocal, engine, run_startup_migrations
from backend.legal_data import seed_legal_sections
from backend.rate_limit import limiter
from backend.routers import chat, conflicts, auth, summarize, amendments, stats, documents

load_dotenv()

# Create db tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NyayaLens API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://192.168.29.50:3000",
    ).split(",")
    if origin.strip()
]

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router)
app.include_router(conflicts.router)
app.include_router(auth.router)
app.include_router(summarize.router)
app.include_router(amendments.router)
app.include_router(stats.router)
app.include_router(documents.router)


@app.on_event("startup")
def startup_seed_data() -> None:
    run_startup_migrations()
    db = SessionLocal()
    try:
        seed_legal_sections(db)
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to NyayaLens backend API!"}
