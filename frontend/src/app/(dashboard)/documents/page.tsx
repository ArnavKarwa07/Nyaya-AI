"use client";

import { useEffect, useMemo, useState } from "react";

import { secureFetch } from "@/lib/api";

type DocumentItem = {
  id: number;
  title: string;
  original_filename: string;
  file_size: number;
  created_at: string;
};

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  const sortedDocuments = useMemo(
    () => [...documents].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [documents],
  );

  const loadDocuments = async () => {
    setIsLoadingList(true);
    try {
      const res = await secureFetch("/documents/");
      if (res.status === 401) {
        setMessage("Please login again to access your documents.");
        return;
      }
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch {
      setMessage("Could not fetch documents from backend.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const openDocument = async (doc: DocumentItem) => {
    try {
      const res = await secureFetch(`/documents/${doc.id}/content`);
      if (!res.ok) {
        setMessage("Unable to load selected PDF.");
        return;
      }
      const blob = await res.blob();
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
      const url = URL.createObjectURL(blob);
      setViewerUrl(url);
      setSelectedDoc(doc);
      setMessage("");
    } catch {
      setMessage("Unable to load selected PDF.");
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title.trim()) {
        formData.append("title", title.trim());
      }

      const res = await secureFetch("/documents/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        setMessage(payload?.detail || "Upload failed.");
        return;
      }

      setMessage("Document uploaded successfully.");
      setFile(null);
      setTitle("");
      await loadDocuments();
    } catch {
      setMessage("Upload failed due to network error.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="documents-page">
      <section className="documents-header">
        <h1 className="documents-title">Document Vault</h1>
        <p className="documents-subtitle">
          Upload legal PDFs and read them directly inside NyayaLens.
        </p>
      </section>

      <section className="documents-upload-card">
        <div className="documents-upload-fields">
          <input
            className="documents-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            maxLength={200}
          />
          <input
            className="documents-file-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            className="documents-upload-btn"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
        {message && <p className="documents-message">{message}</p>}
      </section>

      <section className="documents-grid">
        <div className="documents-list-panel">
          <h2 className="documents-panel-title">Your Documents</h2>
          {isLoadingList ? (
            <p className="documents-empty">Loading documents...</p>
          ) : sortedDocuments.length === 0 ? (
            <p className="documents-empty">No PDFs uploaded yet.</p>
          ) : (
            <div className="documents-list">
              {sortedDocuments.map((doc) => (
                <button
                  key={doc.id}
                  className={`documents-list-item ${selectedDoc?.id === doc.id ? "active" : ""}`}
                  onClick={() => openDocument(doc)}
                >
                  <div>
                    <p className="documents-item-title">{doc.title}</p>
                    <p className="documents-item-meta">
                      {doc.original_filename} • {formatBytes(doc.file_size)}
                    </p>
                  </div>
                  <span className="material-symbols-outlined">open_in_new</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="documents-viewer-panel">
          <h2 className="documents-panel-title">PDF Viewer</h2>
          {viewerUrl ? (
            <iframe
              title={selectedDoc?.title || "PDF viewer"}
              src={viewerUrl}
              className="documents-viewer"
            />
          ) : (
            <div className="documents-viewer-empty">
              Select a document to read it here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
