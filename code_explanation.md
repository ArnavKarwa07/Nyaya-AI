# Nyaya-AI Codebase Explanation

Welcome to the **Nyaya-AI**, The Digital Jurist for Indian Law. This document walks through the structural architecture and critical files of the project to help developers get rapidly up to speed.

## Directory Structure

The project employs a modern dual-architecture setup split between a Python/FastAPI backend and a React/Next.js frontend.

```
Nyaya-AI/
├── backend/          # FastAPI Python Server and core logic
│   ├── database.py   # SQLite connection and session management
│   ├── main.py       # Primary API entry point and app initialization
│   ├── models.py     # SQLAlchemy ORM definitions
│   └── routers/      # API Route Handlers
│       ├── auth.py        # Minimal local login functionality
│       ├── chat.py        # Main Gemini AI interaction endpoints
│       ├── conflicts.py   # AI-powered clause conflict detection
│       ├── summarize.py   # AI-powered legal document summarization
│       └── amendments.py  # AI-powered amendment comparison
├── frontend/         # Next.js 15+ React Application
│   └── src/
│       ├── app/      # App Router Pages
│       │   ├── (dashboard)/ # Protected routing group for logged-in features
│       │   │   ├── chat/        # AI legal chat interface
│       │   │   ├── conflicts/   # Conflict detection dashboard
│       │   │   ├── amendments/  # Amendment tracking & comparison
│       │   │   └── dashboard/   # Analytics overview
│       │   ├── layout.tsx   # Global root layout featuring the AuthProvider
│       │   └── page.tsx     # Landing page and login entrypoint
│       ├── components/ # Reusable UI pieces (LoginButtons, Header, Sidebar)
│       └── context/    # React Contexts
│           └── AuthContext.tsx # Central session state manager
├── .env              # Root environmental configurations
└── .gitignore        # Core exclusions for source control
```

---

## 1. Backend (`/backend`)
The backend is powered by **FastAPI** to provide performant REST API endpoints and leverages **SQLAlchemy** to interface with a local SQLite database (`sql_app.db`).
 
### `main.py`
The bedrock of the backend. It bootstraps the FastAPI app, manages CORS dynamically to allow the frontend connection, configures the Gemini LLM through your `GEMINI_API_KEY`, and embeds the standalone API routers.

### `models.py` & `database.py`
Together these handle data persistence. `database.py` exports the `SessionLocal` dependency. `models.py` defines tables like `ChatHistory` which keep track of interactions the `user_id` has with the assistant.

### `routers/chat.py`
A crucial business logic module. Accepts incoming user questions alongside their `user_id`. It injects a highly specialized prompt specifying the persona of an Indian Law digital jurist and directly utilizes **Google's `generativeai` package (Gemini)** via the configurable `GEMINI_MODEL` env var to form confident, legally-sound responses.

### `routers/conflicts.py`
Accepts source and target legal texts, using Gemini AI to perform automated cross-referencing and identify contradictions, procedural misalignments, and definitional divergences between legal acts.

### `routers/summarize.py`
Accepts legal document text and returns hierarchical AI-generated summaries broken down by sections, powered by the Gemini model.

### `routers/amendments.py`
Compares old and new versions of legal documents, using Gemini AI to identify amendments, changes, additions, and deletions with risk assessment and impact analysis.

---

## 2. Frontend (`/frontend`)
The frontend leverages **Next.js** App Router architecture. It uses **vanilla CSS** for styling, aligned with Material Design 3 aesthetics and a custom legal-professional theme.

### Contexts (`src/context/AuthContext.tsx`)
A custom authentication provider wraps the application state. It checks `localStorage` to see if a user session is active, providing universal `.login()` and `.logout()` functions alongside the active `userId`. This maintains total data ownership and simplicity with no external auth dependencies.

### Authentication Flow (`src/components/LoginButtons.tsx`)
This isolated client component handles the entire lifecycle of a user attempting to interact on the landing page. It flips between an inline login interface (calling the `/auth/login` API route) and presenting the user with dashboard links.

### The Dashboard Interface (`src/app/(dashboard)/*`)
Underneath the dashboard grouping, protected components interact dynamically:
- **`chat/page.tsx`**: The main interface for conversing with Gemini. It tracks message flow in a `useState` array and hits the `backend/routers/chat.py` POST endpoint securely attributing prompts to the active user.
- **`dashboard/page.tsx`**: Provides an analytical overview of active conflicts, historical usage, and system monitoring using predefined static analytics representations.
- **`conflicts/page.tsx`**: Interactive conflict detection tool that accepts source and target legal texts and uses AI to identify contradictions.
- **`amendments/page.tsx`**: Amendment tracking interface for comparing document versions with AI-powered diff analysis and impact assessment.

---

## 3. Environment Configuration

All AI features use the `GEMINI_MODEL` environment variable (defaulting to `gemini-2.0-flash`) for model selection. Key env vars:

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model name (e.g., `gemini-3.1-pro-preview`) |
| `DATABASE_URL` | SQLAlchemy database connection string |
| `NEXT_PUBLIC_API_URL` | Backend API URL for the frontend |
