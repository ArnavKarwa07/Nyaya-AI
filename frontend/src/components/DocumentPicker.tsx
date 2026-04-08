"use client";

import { useEffect, useState, useMemo } from "react";
import { secureFetch } from "@/lib/api";

type DocumentItem = {
  id: number;
  title: string;
  original_filename: string;
  file_size: number;
  created_at: string;
};

type ClauseItem = {
  id: number;
  title: string;
  body: string;
};

interface DocumentPickerProps {
  /** Label shown on the document selector */
  label?: string;
  /** Called when the user selects the full document text */
  onTextExtracted: (text: string, title: string) => void;
  /** Optional extra className */
  className?: string;
}

export default function DocumentPicker({
  label = "Load from document",
  onTextExtracted,
  className = "",
}: DocumentPickerProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>("");

  // Clause state
  const [clauses, setClauses] = useState<ClauseItem[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [clauseSearch, setClauseSearch] = useState("");
  const [showClausePanel, setShowClausePanel] = useState(false);
  const [docTitle, setDocTitle] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await secureFetch("/documents/");
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data.documents) ? data.documents : []);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectDoc = async (value: string) => {
    setSelectedDocId(value);
    setClauses([]);
    setClauseSearch("");

    if (!value) {
      setShowClausePanel(false);
      return;
    }

    const docId = parseInt(value, 10);
    if (isNaN(docId)) return;

    const doc = documents.find((d) => d.id === docId);
    setDocTitle(doc?.title || "Document");

    // Fetch clauses
    setIsLoadingClauses(true);
    setShowClausePanel(true);
    try {
      const res = await secureFetch(`/documents/${docId}/clauses`);
      if (res.ok) {
        const data = await res.json();
        setClauses(Array.isArray(data.clauses) ? data.clauses : []);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingClauses(false);
    }
  };

  const handleLoadFullDocument = async () => {
    if (!selectedDocId) return;
    const docId = parseInt(selectedDocId, 10);
    if (isNaN(docId)) return;

    setIsLoadingClauses(true);
    try {
      const res = await secureFetch(`/documents/${docId}/text`);
      if (res.ok) {
        const data = await res.json();
        onTextExtracted(data.text, docTitle);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingClauses(false);
    }
  };

  const handleAddClause = (clause: ClauseItem) => {
    onTextExtracted(clause.body, `${docTitle} — ${clause.title}`);
  };

  const filteredClauses = useMemo(() => {
    if (!clauseSearch.trim()) return clauses;
    const q = clauseSearch.toLowerCase();
    return clauses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q),
    );
  }, [clauses, clauseSearch]);

  if (isLoading) {
    return (
      <div className={`doc-picker ${className}`}>
        <span className="doc-picker-loading">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) return null;

  return (
    <div className={`doc-picker ${className}`}>
      {/* Document selector row */}
      <div className="doc-picker-inner">
        <span className="material-symbols-outlined doc-picker-icon">
          upload_file
        </span>
        <select
          className="doc-picker-select"
          value={selectedDocId}
          onChange={(e) => handleSelectDoc(e.target.value)}
          disabled={isLoadingClauses}
        >
          <option value="">{label}</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id.toString()}>
              {doc.title} ({doc.original_filename})
            </option>
          ))}
        </select>
        {selectedDocId && (
          <button
            className="doc-picker-load-all-btn"
            onClick={handleLoadFullDocument}
            disabled={isLoadingClauses}
            title="Load entire document text"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
              file_copy
            </span>
            Load All
          </button>
        )}
      </div>

      {/* Clause browsing panel */}
      {showClausePanel && (
        <div className="clause-panel">
          <div className="clause-panel-header">
            <span className="clause-panel-title">
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                segment
              </span>
              Clauses from &ldquo;{docTitle}&rdquo;
              {clauses.length > 0 && (
                <span className="clause-count-badge">{clauses.length}</span>
              )}
            </span>
            <button
              className="clause-panel-close"
              onClick={() => setShowClausePanel(false)}
              aria-label="Close clause panel"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.125rem" }}>
                close
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="clause-search-row">
            <span className="material-symbols-outlined clause-search-icon">
              search
            </span>
            <input
              type="text"
              className="clause-search-input"
              placeholder="Search clauses, sections, articles..."
              value={clauseSearch}
              onChange={(e) => setClauseSearch(e.target.value)}
            />
            {clauseSearch && (
              <button
                className="clause-search-clear"
                onClick={() => setClauseSearch("")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                  close
                </span>
              </button>
            )}
          </div>

          {/* Clause list */}
          <div className="clause-list">
            {isLoadingClauses ? (
              <div className="clause-loading">
                <span className="material-symbols-outlined doc-picker-spinner">
                  progress_activity
                </span>
                <span>Extracting clauses...</span>
              </div>
            ) : filteredClauses.length === 0 ? (
              <div className="clause-empty">
                {clauses.length === 0
                  ? "No clauses or sections detected in this document."
                  : "No clauses matching your search."}
              </div>
            ) : (
              filteredClauses.map((clause) => (
                <button
                  key={clause.id}
                  className="clause-item"
                  onClick={() => handleAddClause(clause)}
                  title="Click to add this clause"
                >
                  <div className="clause-item-header">
                    <span className="clause-item-id">#{clause.id}</span>
                    <span className="clause-item-title">{clause.title}</span>
                  </div>
                  <p className="clause-item-preview">
                    {clause.body.substring(0, 150)}
                    {clause.body.length > 150 ? "..." : ""}
                  </p>
                  <span className="clause-add-hint">
                    <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
                      add_circle
                    </span>
                    Add
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
