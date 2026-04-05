from typing import Any, TypedDict

from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from backend.rag_engine import build_rag_context


class RagState(TypedDict, total=False):
    user_id: str
    query: str
    rag_context: str
    citations: list[str]
    prompt: str
    response: str
    confidence: int


def _retrieve_node(state: RagState, db: Session) -> RagState:
    rag_context, citations = build_rag_context(db, state["user_id"], state["query"])
    return {
        "rag_context": rag_context or "No relevant legal source was retrieved from the local corpus.",
        "citations": citations,
    }


def _prompt_node(state: RagState) -> RagState:
    prompt = f"""
You are NyayaLens Digital Jurist, a retrieval-grounded legal intelligence assistant for Indian law.
Follow these strict rules:
1. Ground your answer in the retrieved context when available.
2. Cite legal provisions explicitly in your answer.
3. If context is insufficient, clearly say what is missing and provide a cautious response.
4. Prefer structured output: issue, applicable law, analysis, conclusion.
5. Do not fabricate case names or section text.

{state['rag_context']}

User Query: {state['query']}

Provide your response with specific legal references.
"""
    return {"prompt": prompt}


def _llm_node(state: RagState, llm: ChatGroq) -> RagState:
    result = llm.invoke([HumanMessage(content=state["prompt"])])
    response = str(result.content).strip()

    # Confidence is currently heuristic until retrieval/grounding evaluator is added.
    confidence = 92 if state.get("citations") else 75
    return {"response": response, "confidence": confidence}


def run_rag_chat(db: Session, user_id: str, query: str, llm: ChatGroq) -> dict[str, Any]:
    workflow = StateGraph(RagState)

    workflow.add_node("retrieve", lambda s: _retrieve_node(s, db))
    workflow.add_node("build_prompt", _prompt_node)
    workflow.add_node("generate", lambda s: _llm_node(s, llm))

    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "build_prompt")
    workflow.add_edge("build_prompt", "generate")
    workflow.add_edge("generate", END)

    app = workflow.compile()
    final_state = app.invoke({"user_id": user_id, "query": query})

    return {
        "response": final_state.get("response", ""),
        "confidence": int(final_state.get("confidence", 0)),
        "citations": list(final_state.get("citations", [])),
    }
