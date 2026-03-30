"use client"
import { useState } from 'react'

export default function AmendmentTrackerPage() {
  const [oldText, setOldText] = useState("14.b.1 The Agreement may be terminated by either Party upon giving thirty (30) days written notice to the other Party in the event of a material breach that has not been cured within the notice period.")
  const [newText, setNewText] = useState("14.b.1 The Agreement may be terminated by either Party upon giving sixty (60) calendar days written notice to the other Party in the event of a material breach that has not been cured within the notice period. The breaching party shall be provided an additional 15-day grace period.")
  const [docTitle, setDocTitle] = useState("Shareholder Agreement V.4.2")
  const [result, setResult] = useState<{changes: Array<{clause: string; change_type: string; old_content: string; new_content: string; risk_level: string; impact_analysis: string}>; total_additions: number; total_deletions: number; risk_summary: string; ai_impact_analysis: string; confidence: number} | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCompare = async () => {
    if (!oldText.trim() || !newText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/amendments/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_text: oldText, new_text: newText, document_title: docTitle })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        changes: [],
        total_additions: 0,
        total_deletions: 0,
        risk_summary: "Failed to connect to backend API.",
        ai_impact_analysis: "Error: Could not reach the backend server.",
        confidence: 0
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="amendments-container">
      {/* Header */}
      <div className="amendments-page-header">
        <nav className="amendments-breadcrumb">
          <span>Documents</span>
          <span className="material-symbols-outlined breadcrumb-arrow">chevron_right</span>
          <span>Corporate Bylaws</span>
          <span className="material-symbols-outlined breadcrumb-arrow">chevron_right</span>
          <span className="breadcrumb-current">Amendment Tracking</span>
        </nav>
        <h1 className="amendments-page-title">{docTitle}</h1>
        <p className="amendments-page-desc">Compare document versions and track structural and linguistic modifications with AI-powered impact analysis.</p>
      </div>

      {/* Input Section */}
      <div className="amendments-input-grid">
        <div className="amendments-input-panel">
          <div className="amendments-input-header">
            <span className="amendments-input-label">Baseline Version (Old)</span>
          </div>
          <textarea
            className="amendments-textarea"
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="Paste the old version text here..."
            rows={6}
          />
        </div>
        <div className="amendments-input-panel">
          <div className="amendments-input-header">
            <span className="amendments-input-label">Current Version (New)</span>
          </div>
          <textarea
            className="amendments-textarea"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Paste the new version text here..."
            rows={6}
          />
        </div>
      </div>

      <div className="amendments-actions-bar">
        <div className="amendments-doc-title-input">
          <label className="amendments-label">Document Title</label>
          <input
            type="text"
            className="amendments-title-field"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document title..."
          />
        </div>
        <button onClick={handleCompare} disabled={isLoading} className="amendments-compare-btn">
          <span className="material-symbols-outlined icon-small">difference</span>
          {isLoading ? "Comparing..." : "Compare Versions"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="amendments-results">
          {/* Stats */}
          <div className="amendments-stats-row">
            <div className="amendments-stat">
              <span className="amendments-stat-label">Additions</span>
              <span className="amendments-stat-value stat-add">{result.total_additions}</span>
            </div>
            <div className="amendments-stat">
              <span className="amendments-stat-label">Deletions</span>
              <span className="amendments-stat-value stat-del">{result.total_deletions}</span>
            </div>
            <div className="amendments-stat">
              <span className="amendments-stat-label">Confidence</span>
              <span className="amendments-stat-value">{result.confidence}%</span>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="amendments-risk-banner">
            <span className="material-symbols-outlined">shield</span>
            <span className="amendments-risk-text">{result.risk_summary}</span>
          </div>

          {/* Changes List */}
          <div className="amendments-changes-grid">
            <div className="amendments-changes-list">
              <h3 className="amendments-section-title">Detected Changes</h3>
              {result.changes.map((change, idx) => (
                <div key={idx} className="amendment-change-card">
                  <div className="change-card-header">
                    <span className="change-clause-tag">{change.clause}</span>
                    <span className={`change-type-badge ${change.change_type === 'Addition' ? 'type-add' : change.change_type === 'Deletion' ? 'type-del' : 'type-mod'}`}>
                      {change.change_type}
                    </span>
                    <span className={`change-risk-badge ${change.risk_level === 'High Risk' ? 'risk-high' : change.risk_level === 'Low Risk' ? 'risk-low' : 'risk-med'}`}>
                      {change.risk_level}
                    </span>
                  </div>

                  {/* Diff display */}
                  <div className="change-diff-grid">
                    {change.old_content && change.old_content !== "N/A" && (
                      <div className="change-diff-old">
                        <span className="diff-label">Removed</span>
                        <p className="diff-text diff-text-old">{change.old_content}</p>
                      </div>
                    )}
                    {change.new_content && change.new_content !== "N/A" && (
                      <div className="change-diff-new">
                        <span className="diff-label">Added</span>
                        <p className="diff-text diff-text-new">{change.new_content}</p>
                      </div>
                    )}
                  </div>

                  {change.impact_analysis && (
                    <div className="change-impact">
                      <span className="material-symbols-outlined icon-small">info</span>
                      <span className="change-impact-text">{change.impact_analysis}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Impact Analysis */}
            <div className="amendments-ai-panel">
              <div className="ai-panel-header">
                <span className="material-symbols-outlined">auto_awesome</span>
                <span className="ai-panel-title">Jurist AI Impact Analysis</span>
              </div>
              <p className="ai-panel-text">{result.ai_impact_analysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="amendments-loading">
          <div className="amendments-loading-inner">
            <span className="material-symbols-outlined amendments-loading-icon">hourglass_top</span>
            <p className="amendments-loading-text">Comparing document versions...</p>
            <div className="loading-skeletons">
              <div className="skeleton-line long"></div>
              <div className="skeleton-line short"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
