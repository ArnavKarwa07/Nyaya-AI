"use client"
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

type Message = {
  role: string;
  content: string;
  confidence?: number;
};

export default function ChatPage() {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, user_id: userId || "anonymous" })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.response, confidence: data.confidence }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Error connecting to backend API.", confidence: 0 }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="chat-layout">
      <section className="chat-main-area">
        <div className="chat-messages-container">
          {/* Welcome screen when no messages */}
          {messages.length === 0 && !isLoading && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', fontVariationSettings: "'FILL' 1" }}>balance</span>
              </div>
              <h2 className="chat-welcome-title">NyayaLens Digital Jurist</h2>
              <p className="chat-welcome-desc">Ask me anything about Indian law — IPC, BNS, Supreme Court precedents, legal principles, and more.</p>
              <div className="chat-suggestions">
                <button className="chat-suggestion-chip" onClick={() => setInput("What is Section 302 IPC and its BNS equivalent?")}>
                  <span className="material-symbols-outlined icon-tiny">gavel</span>
                  Section 302 IPC vs BNS
                </button>
                <button className="chat-suggestion-chip" onClick={() => setInput("Explain the doctrine of Pith and Substance in Indian constitutional law")}>
                  <span className="material-symbols-outlined icon-tiny">menu_book</span>
                  Pith and Substance Doctrine
                </button>
                <button className="chat-suggestion-chip" onClick={() => setInput("What are the new provisions in BNS that have no IPC equivalent?")}>
                  <span className="material-symbols-outlined icon-tiny">auto_awesome</span>
                  New BNS Provisions
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role === 'user' ? 'user-message-wrapper' : 'ai-message-wrapper'}`}>
              {msg.role === "user" ? (
                <div className="user-bubble">
                  {msg.content}
                </div>
              ) : (
                <div className="ai-message-block">
                  <div className="ai-avatar">
                    <span className="material-symbols-outlined icon-small">auto_awesome</span>
                  </div>
                  <div className="ai-content-area">
                    <div className="ai-header-row">
                      <h3 className="ai-title">Legal Interpretation</h3>
                      {msg.confidence !== undefined && msg.confidence > 0 && (
                        <div className="confidence-badge">
                          <span className="material-symbols-outlined icon-tiny">verified</span>
                          {msg.confidence}% CONFIDENCE
                        </div>
                      )}
                    </div>
                    <div className="ai-body-text">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="loading-wrapper">
              <div className="ai-avatar">
                <span className="material-symbols-outlined icon-small">auto_awesome</span>
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="chat-actions">
              <button onClick={handleSend} disabled={isLoading} className="btn-send">
                <span className="material-symbols-outlined icon-medium">send</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
