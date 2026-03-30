from fastapi import FastAPI
from dotenv import load_dotenv
import os
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware

from backend import models
from backend.database import engine
from backend.routers import chat, conflicts, auth, summarize, amendments, stats

load_dotenv()

# Create db tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="NyayaLens API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app.include_router(chat.router)
app.include_router(conflicts.router)
app.include_router(auth.router)
app.include_router(summarize.router)
app.include_router(amendments.router)
app.include_router(stats.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to NyayaLens backend API!"}
