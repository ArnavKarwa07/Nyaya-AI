# NyayaLens AI Experimental Setup and Results Draft

## V. EXPERIMENTAL SETUP

### A. System Under Evaluation
This work evaluates the current NyayaLens AI implementation, a FastAPI and Next.js based platform for Indian legal document analysis. The system supports document ingestion, corpus seeding, legal question answering, summarization, cross-act conflict detection, amendment comparison, authentication, and usage statistics. The backend also includes rate limiting, CORS configuration, and graceful fallback behavior when the Groq API key is unavailable.

### B. Evaluation Scope
The current evaluation is implementation-oriented rather than benchmark-driven. Instead of a fabricated 360-query annotated benchmark, the system is assessed through code review and live smoke testing of the deployed application surfaces. The goal is to verify whether the major user-facing workflows and backend services are functional, whether the seeded legal corpus is initialized correctly, and whether the AI-backed routes fail gracefully under missing-model conditions.

### C. Evaluation Protocol and Metrics
The following properties were checked during evaluation:

- Service availability for the backend and frontend
- Successful user registration and authenticated route access
- Corpus seeding and stats retrieval
- Conflict detection and amendment comparison route behavior
- Graceful handling of missing Groq credentials
- Readiness of the current legal corpus and retrieval layer

For this version of the system, the most relevant metrics are functional success rate, route responsiveness, retrieval readiness, graceful degradation, and observed latency where available.

### Suggested Figures

- Fig. 1. System architecture diagram showing the frontend, FastAPI backend, seeded corpus, document routes, and AI workflows.
- Fig. 2. Endpoint health chart showing which routes returned successfully during smoke testing.
- Fig. 3. Feature coverage bar chart comparing implemented modules such as chat, summarization, conflict detection, amendment comparison, auth, and stats.
- Fig. 4. Latency comparison chart for the major user flows, if you collect repeated timing measurements.
- Fig. 5. Corpus composition chart showing the distribution of seeded legal sections by act or category.

## VI. RESULTS

### A. Overall System Performance
Table I summarizes the observed system validation results from the repository’s current implementation. The backend and frontend both launched successfully, the corpus seeding path worked, and the main legal workflow endpoints were callable. The chat route depends on a configured Groq key, so in the current development environment it may wait on model access, which is expected behavior rather than a failure of the route wiring.

| Check | Endpoint / Surface | Result | Notes |
| ---- | ---- | ---- | ---- |
| 1 | GET /health | Success | API responsive |
| 2 | POST /auth/register | Success | User creation worked |
| 3 | POST /chat/ | Conditional | Can wait on Groq key in placeholder environments |
| 4 | POST /stats/seed/reindex | Success | Corpus seeding confirmed |
| 5 | GET /stats/{user_id} | Success | Analytics data returned |
| 6 | POST /conflicts/ | Success | Callable and fails gracefully when model access is missing |
| 7 | POST /summarize/ | Success | Callable and fails gracefully when model access is missing |
| 8 | POST /amendments/compare | Success | Callable and fails gracefully when model access is missing |
| 9 | Frontend health | Success | Dev server running on port 3000 |
| 10 | Frontend environment | Verified | NEXT_PUBLIC_API_URL configured correctly |

**Table I.** Implementation validation summary. This is a functional readiness table, not a human-annotated benchmark score table.

The main result is that the application is operational as a working MVP: core routes are wired correctly, the UI loads, the legal corpus can be seeded, and the structured analysis endpoints are reachable. The current limitations are therefore engineering limitations rather than architectural breakdowns.

### B. Task-Specific Performance Analysis
The strongest part of the system is the legal workflow coverage. Conflict detection and amendment comparison are both exposed as dedicated routes with structured request and response schemas, while the summarization and stats flows are integrated into the same backend. The corpus retrieval path is also acceptable for the current dataset size. The code review notes that the legal corpus retrieval is still a linear scan with TF-IDF scoring and is currently acceptable for roughly 177 records, with expected latency under 50 ms at this scale.

This means the current comparison is best understood as a comparison of workflow readiness rather than model benchmark superiority. In practical terms, the system already supports the core legal analysis paths that a user would interact with, but it still needs stronger production hardening before being treated as a fully deployed legal assistant.

| Area | Observation | Current Status |
| ---- | ---- | ---- |
| Document ingestion | Upload and corpus seeding path exists | Implemented |
| Legal chat | Context-aware chat route exists | Implemented, model-dependent |
| Summarization | Dedicated summarize route exists | Implemented |
| Conflict detection | Dedicated conflict route exists | Implemented |
| Amendment analysis | Dedicated compare route exists | Implemented |
| Auth | Registration and protected routes are present | Implemented, needs JWT hardening |
| Stats | User stats endpoint is available | Implemented |

**Table II.** Workflow coverage and implementation status.

### C. Qualitative Error Analysis
The current implementation reveals a small number of practical gaps that affect readiness. Some routes still depend on external model availability, the auth system needs stronger token handling, and the default placeholder text in the conflicts and amendments pages should be replaced with production content. The retrieval layer is adequate for the present corpus size, but it will need indexing or embedding-based retrieval if the dataset grows substantially.

These limitations do not invalidate the system, but they do define the next engineering steps. The current version is best described as a functional MVP with validated core behavior and clear production-hardening tasks.

### D. Figures To Add

**Fig. 1. System architecture diagram.** Show the frontend, backend API, database, seeded corpus, and AI routes as a left-to-right pipeline.

**Fig. 2. Endpoint health chart.** Use a green/red bar chart or checklist visualization showing which routes passed smoke testing.

**Fig. 3. Feature coverage chart.** Compare the major modules: chat, summarize, conflicts, amendments, auth, and stats.

**Fig. 4. Latency chart.** If you gather measurements, show median response time for the key routes.

**Fig. 5. Corpus composition chart.** Plot the number of seeded sections by statute or legal category.

If you want, I can turn this draft into a more formal paper-style version and also generate Mermaid diagrams for Fig. 1 and Fig. 2 directly in markdown.