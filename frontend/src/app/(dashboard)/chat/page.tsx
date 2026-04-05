"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { secureFetch } from "@/lib/api";

type Message = {
  role: string;
  content: string;
  confidence?: number;
  citations?: string[];
};

export default function ChatPage() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await secureFetch("/chat/", {
        method: "POST",
        body: JSON.stringify({ query: input }),
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
      <section className="chat-main-area">
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
                    <div className="ai-body-text">{msg.content}</div>
                    {msg.citations && msg.citations.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {msg.citations.map((citation, idx) => (
                          <span
                            key={`${citation}-${idx}`}
                            style={{
                              fontSize: "0.75rem",
                              border: "1px solid var(--color-outline)",
                              borderRadius: "999px",
                              padding: "0.2rem 0.6rem",
                              background: "var(--color-surface-2)",
                              color: "var(--color-secondary)",
                            }}
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
        </div>

        <div className="chat-input-area">
          <div className="chat-input-container">
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
