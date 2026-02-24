# System Architecture

## Overview

NyayaLens AI combines RAG, Knowledge Graphs, and Self-Learning Pipelines.

---

## High-Level Flow

1. Upload Document
2. Parse Structure
3. Generate Embeddings
4. Build Knowledge Graph
5. Store in Vector DB
6. Query & Reason
7. Capture Feedback
8. Improve Retrieval

---

## Frontend

Next.js App Router:

- Document uploader
- Graph explorer
- AI chat interface

---

## Backend Modules
/ingestion
/nlp
/rag
/reasoning
/feedback
/memory
/graph


---

## AI Pipeline

### Parsing
Detect Sections, Clauses, Articles.

### Retrieval
Vector search retrieves relevant chunks.

### Reasoning
Groq LLM generates explainable responses.

### Learning Loop
Feedback updates ranking and prompts.

---

## Self-Learning Cycle

User Query
→ AI Response
→ Feedback Captured
→ Ranking Adjusted
→ Better Future Retrieval