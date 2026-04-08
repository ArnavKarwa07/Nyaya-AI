# System Architecture

## Overview

NyayaLens AI is a RAG-based legal document analysis platform with real-time chat and conflict detection.

---

## High-Level Flow

1. Upload Document
2. Parse and Extract Text
3. Store Document
4. Query via RAG
5. Retrieve Relevant Sections
6. Generate Response via LLM
7. Log Chat History

---

## Frontend

Next.js App Router:

- Document uploader
- Graph explorer
- AI chat interface

---

## Backend Modules
/routers (API endpoints for chat, conflicts, amendments, summarize, documents, auth, stats)
/rag_engine (Retrieval logic)
/rag_graph (Chat flow orchestration)
/database (SQLAlchemy models)
/security (Authentication)


---

## AI Pipeline

### Parsing
Detect Sections, Clauses, Articles.

### Retrieval
Vector search retrieves relevant chunks.

### Reasoning
Groq LLM generates explainable responses.

### Current Chat Flow
User Query
→ Document Retrieval
→ Context Preparation
→ LLM Generation
→ Response & Citation
→ History Logged