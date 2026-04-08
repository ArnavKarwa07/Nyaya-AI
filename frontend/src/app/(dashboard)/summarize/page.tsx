"use client";

import { useState } from "react";
import DocumentPicker from "@/components/DocumentPicker";
import { secureFetch } from "@/lib/api";

type SummarizeResponse = {
  summary: string;
  sections: Array<{ title: string; content: string }>;
  confidence: number;
};

export default function SummarizePage() {
  const [documentText, setDocumentText] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentSelect = (text: string, title: string) => {
    setDocumentText(text);
    setDocumentTitle(title);
    setResult(null);
    setError(null);
  };

  const handleSummarize = async () => {
    if (!documentText) {
      setError("Please select a document or clause first.");
      return;
    }
    
    if (documentText.length < 50) {
      setError("Document text must be at least 50 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await secureFetch("/summarize/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_text: documentText.substring(0, 20000) }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate summary");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summarize-container">
      <div className="summarize-header">
        <div>
          <h1 className="summarize-title">Document Summarizer</h1>
          <p className="summarize-subtitle">
            Extract key points from Indian legal documents using NyayaLens AI.
          </p>
        </div>
      </div>

      <div className="summarize-form-container">
        <label className="input-label" style={{ marginBottom: "0.5rem", display: "block" }}>
          Select Document
        </label>
        <DocumentPicker
          label="Select a document to summarize..."
          onTextExtracted={handleDocumentSelect}
        />

        {documentText && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--color-primary)", fontWeight: "600", marginBottom: "0.5rem" }}>
              Ready to summarize: {documentTitle}
            </p>
            <textarea
              className="text-input"
              style={{ minHeight: "150px" }}
              value={documentText}
              readOnly
            />
          </div>
        )}

        {error && (
          <div className="alert-box alert-error" style={{ marginTop: "1rem" }}>
            <span className="material-symbols-outlined icon-small">error</span>
            {error}
          </div>
        )}

        <div className="summarize-action-bar">
          <div className="hint-text">
            For large documents, we will summarize the first 20,000 characters.
          </div>
          <button
            className="btn-summarize"
            onClick={handleSummarize}
            disabled={isLoading || !documentText}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined icon-spin">progress_activity</span>
                Summarizing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">subject</span>
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="summarize-result-container">
          <div className="summary-header-row">
            <div className="summary-overall">
              <h3 className="section-title" style={{ fontSize: "1.25rem", color: "var(--color-primary)" }}>
                Executive Summary
              </h3>
              {result.summary}
            </div>
            <div className="summary-confidence">
              <span className="confidence-val">{result.confidence}</span>
              <span className="confidence-lbl">Confidence</span>
            </div>
          </div>

          <h3 className="sections-title">
            <span className="material-symbols-outlined" style={{ color: "var(--color-secondary)" }}>
              schema
            </span>
            Key Sections
          </h3>
          <div className="sections-list">
            {result.sections.map((sec, idx) => (
              <div key={idx} className="section-card">
                <h4 className="section-title">{sec.title}</h4>
                <p className="section-content">{sec.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
