"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { secureFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DocumentItem = {
  id: number;
  title: string;
  original_filename: string;
};

type Message = {
  role: string;
  content: string;
  confidence?: number;
  citations?: string[];
};

type ChatHistoryItem = {
  id: number;
  query: string;
  response: string;
  confidence: number;
  created_at: string;
  citations?: string[];
};

export default function ChatPage() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Document attachment state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await secureFetch("/chat/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // ignore
    }
  };

  // Load documents list and history on mount
  useEffect(() => {
    const loadDocs = async () => {
      setIsLoadingDocs(true);
      try {
        const res = await secureFetch("/documents/");
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data.documents) ? data.documents : []);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocs();
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const handleLoadHistory = (item: ChatHistoryItem) => {
    setMessages([
      { role: "user", content: item.query },
      {
        role: "ai",
        content: item.response,
        confidence: item.confidence,
        citations: item.citations,
      },
    ]);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleAttachDoc = (value: string) => {
    if (!value) return;
    const docId = parseInt(value, 10);
    const doc = documents.find((d) => d.id === docId);
    if (doc && !attachedDocs.find((d) => d.id === docId)) {
      setAttachedDocs((prev) => [...prev, doc]);
    }
  };

  const handleRemoveDoc = (docId: number) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const body: Record<string, unknown> = { query: input };
      if (attachedDocs.length > 0) {
        body.document_ids = attachedDocs.map((d) => d.id);
      }

      const res = await secureFetch("/chat/", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Your session has expired. Please login again.",
            confidence: 0,
          },
        ]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: data.response,
          confidence: data.confidence,
          citations: data.citations || [],
        },
      ]);
      fetchHistory(); // Refresh history
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Error connecting to backend API.",
          confidence: 0,
        },
      ]);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-layout">
      {/* Sidebar for History */}
      {isSidebarOpen && (
        <aside className="chat-history-sidebar">
          <div className="history-header">
            <h3>Recent Chats</h3>
            <button
              onClick={() => {
                setMessages([]);
                setInput("");
              }}
              className="btn-new-chat"
              title="New Chat"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="no-history">No past conversations.</p>
            ) : (
              history.map((h) => (
                <button
                  key={h.id}
                  className="history-item"
                  onClick={() => handleLoadHistory(h)}
                >
                  <span className="material-symbols-outlined icon-small">chat_bubble</span>
                  <div className="history-text">
                    <span className="history-query">{h.query}</span>
                    <span className="history-date">
                      {new Date(h.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>
      )}

      <section className="chat-main-area">
        <div className="chat-top-bar" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderBottom: '1px solid rgba(198, 197, 212, 0.2)' }}>
          <button 
            className="history-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-outline)' }}
            title={isSidebarOpen ? "Hide History" : "Show History"}
          >
            <span className="material-symbols-outlined">{isSidebarOpen ? "view_sidebar" : "menu"}</span>
          </button>
        </div>
        <div className="chat-messages-container">
          {/* Welcome screen when no messages */}
          {messages.length === 0 && !isLoading && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "2.5rem",
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  balance
                </span>
              </div>
              <h2 className="chat-welcome-title">NyayaLens Digital Jurist</h2>
              <p className="chat-welcome-desc">
                Ask me anything about Indian law — IPC, BNS, Supreme Court
                precedents, legal principles, and more.
              </p>
              {!userId && (
                <p
                  className="chat-welcome-desc"
                  style={{ marginTop: "0.5rem", color: "var(--color-error)" }}
                >
                  Login is required to use AI chat.
                </p>
              )}
              <div className="chat-suggestions">
                <button
                  className="chat-suggestion-chip"
                  onClick={() =>
                    setInput("What is Section 302 IPC and its BNS equivalent?")
                  }
                >
                  <span className="material-symbols-outlined icon-tiny">
                    gavel
                  </span>
                  Section 302 IPC vs BNS
                </button>
                <button
                  className="chat-suggestion-chip"
                  onClick={() =>
                    setInput(
                      "Explain the doctrine of Pith and Substance in Indian constitutional law",
                    )
                  }
                >
                  <span className="material-symbols-outlined icon-tiny">
                    menu_book
                  </span>
                  Pith and Substance Doctrine
                </button>
                <button
                  className="chat-suggestion-chip"
                  onClick={() =>
                    setInput(
                      "What are the new provisions in BNS that have no IPC equivalent?",
                    )
                  }
                >
                  <span className="material-symbols-outlined icon-tiny">
                    auto_awesome
                  </span>
                  New BNS Provisions
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-wrapper ${msg.role === "user" ? "user-message-wrapper" : "ai-message-wrapper"}`}
            >
              {msg.role === "user" ? (
                <div className="user-bubble">{msg.content}</div>
              ) : (
                <div className="ai-message-block">
                  <div className="ai-avatar">
                    <span className="material-symbols-outlined icon-small">
                      auto_awesome
                    </span>
                  </div>
                  <div className="ai-content-area">
                    <div className="ai-header-row">
                      <h3 className="ai-title">Legal Interpretation</h3>
                      {msg.confidence !== undefined && msg.confidence > 0 && (
                        <div className="confidence-badge">
                          <span className="material-symbols-outlined icon-tiny">
                            verified
                          </span>
                          {msg.confidence}% CONFIDENCE
                        </div>
                      )}
                    </div>
                    <div className="ai-body-text markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="ai-citations-row">
                        {msg.citations.map((citation, cidx) => (
                          <span
                            key={`${citation}-${cidx}`}
                            className="ai-citation-chip"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading-wrapper">
              <div className="ai-avatar">
                <span className="material-symbols-outlined icon-small">
                  auto_awesome
                </span>
              </div>
              <div className="loading-skeletons">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-container">
            {/* Document attachment bar */}
            {documents.length > 0 && (
              <div className="chat-doc-attach-bar">
                <span className="chat-doc-attach-label">
                  <span className="material-symbols-outlined">attach_file</span>
                  Docs
                </span>
                <select
                  className="chat-doc-select"
                  value=""
                  onChange={(e) => handleAttachDoc(e.target.value)}
                  disabled={isLoadingDocs}
                >
                  <option value="">
                    {isLoadingDocs
                      ? "Loading..."
                      : "Attach a document for context..."}
                  </option>
                  {documents
                    .filter((d) => !attachedDocs.find((a) => a.id === d.id))
                    .map((doc) => (
                      <option key={doc.id} value={doc.id.toString()}>
                        {doc.title} ({doc.original_filename})
                      </option>
                    ))}
                </select>
                {attachedDocs.length > 0 && (
                  <div className="chat-doc-chips">
                    {attachedDocs.map((doc) => (
                      <span key={doc.id} className="chat-doc-chip">
                        <span className="material-symbols-outlined icon-tiny">
                          description
                        </span>
                        {doc.title}
                        <button
                          className="chat-doc-chip-remove"
                          onClick={() => handleRemoveDoc(doc.id)}
                          aria-label={`Remove ${doc.title}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              className="chat-textarea"
              placeholder="Type your legal query... (e.g., Explain the doctrine of 'Pith and Substance')"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="chat-actions">
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="btn-send"
              >
                <span className="material-symbols-outlined icon-medium">
                  send
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
