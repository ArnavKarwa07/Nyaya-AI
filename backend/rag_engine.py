import math
import re
from collections import Counter
from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend import models

STOP_WORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "under",
    "shall",
    "would",
    "which",
    "where",
    "what",
    "when",
    "about",
    "have",
    "been",
    "their",
    "there",
    "than",
    "then",
    "also",
    "such",
    "any",
    "all",
    "are",
    "was",
    "were",
    "your",
    "does",
    "how",
    "can",
    "ipc",
    "bns",
}


@dataclass
class RetrievedSection:
    section: models.LegalSection
    score: float


def _tokenize(text: str) -> list[str]:
    cleaned = re.sub(r"[^a-zA-Z0-9 ]+", " ", text.lower())
    tokens = [t for t in cleaned.split() if len(t) >= 3 and t not in STOP_WORDS]
    return tokens


def _section_document(section: models.LegalSection) -> str:
    return " ".join(
        [
            section.code,
            section.section,
            section.title,
            section.description,
            section.chapter or "",
            section.ipc_equivalent or "",
            section.keywords or "",
        ]
    )


def retrieve_legal_sections(db: Session, query: str, top_k: int = 8) -> list[RetrievedSection]:
    sections = db.query(models.LegalSection).filter(models.LegalSection.is_active == True).all()
    if not sections:
        return []

    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    documents: list[tuple[models.LegalSection, Counter[str]]] = []
    document_frequency: Counter[str] = Counter()

    for section in sections:
        tokens = _tokenize(_section_document(section))
        token_counter = Counter(tokens)
        if not token_counter:
            continue
        documents.append((section, token_counter))
        for token in token_counter.keys():
            document_frequency[token] += 1

    if not documents:
        return []

    total_docs = len(documents)
    query_counter = Counter(query_tokens)
    ranked: list[RetrievedSection] = []
    query_lower = query.lower()

    for section, term_counts in documents:
        score = 0.0
        for term, q_tf in query_counter.items():
            doc_tf = term_counts.get(term, 0)
            if doc_tf == 0:
                continue
            df = document_frequency.get(term, 1)
            idf = math.log((total_docs + 1) / (df + 1)) + 1.0
            score += (1.0 + math.log(doc_tf)) * q_tf * idf

        section_key = f"section {section.section}".lower()
        if section_key in query_lower:
            score += 3.0
        if section.title.lower() in query_lower:
            score += 2.0
        if section.code.lower() in query_lower:
            score += 1.2

        if score > 0:
            ranked.append(RetrievedSection(section=section, score=score))

    ranked.sort(key=lambda item: item.score, reverse=True)
    return ranked[:top_k]


def retrieve_reasoning_memory(db: Session, user_id: str, query: str, top_k: int = 2) -> list[models.ChatHistory]:
    chats = (
        db.query(models.ChatHistory)
        .filter(models.ChatHistory.user_id == user_id)
        .order_by(models.ChatHistory.created_at.desc())
        .limit(60)
        .all()
    )
    if not chats:
        return []

    query_tokens = set(_tokenize(query))
    if not query_tokens:
        return chats[:top_k]

    scored: list[tuple[int, models.ChatHistory]] = []
    for item in chats:
        prior_tokens = set(_tokenize(f"{item.query} {item.response or ''}"))
        overlap = len(query_tokens.intersection(prior_tokens))
        if overlap > 0:
            scored.append((overlap, item))

    scored.sort(key=lambda row: row[0], reverse=True)
    return [item for _, item in scored[:top_k]]


def build_rag_context(db: Session, user_id: str, query: str) -> tuple[str, list[str]]:
    retrieved_sections = retrieve_legal_sections(db, query, top_k=8)
    memory_items = retrieve_reasoning_memory(db, user_id, query, top_k=2)

    context_parts: list[str] = []
    citations: list[str] = []

    if retrieved_sections:
        context_parts.append("RETRIEVED LEGAL SOURCES:")
        for index, item in enumerate(retrieved_sections, start=1):
            source = item.section
            citation = f"{source.code} {source.section}"
            citations.append(citation)
            eq = f" | IPC mapping: {source.ipc_equivalent}" if source.ipc_equivalent else ""
            context_parts.append(
                f"{index}. {citation} | {source.title}{eq} | {source.description}"
            )

    if memory_items:
        context_parts.append("\nREASONING MEMORY FROM PRIOR USER QUERIES:")
        for index, memory in enumerate(memory_items, start=1):
            trimmed_answer = (memory.response or "").replace("\n", " ")[:260]
            context_parts.append(
                f"{index}. Prior Query: {memory.query} | Prior Answer: {trimmed_answer}"
            )

    return "\n".join(context_parts).strip(), citations
