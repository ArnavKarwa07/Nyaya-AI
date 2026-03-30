"use client"
import { useState } from 'react'

export default function ConflictsPage() {
  const [sourceText, setSourceText] = useState("IPC Section 124A - Sedition: Whoever, by words, either spoken or written, or by signs, or by visible representation, or otherwise, brings or attempts to bring into hatred or contempt, or excites or attempts to excite disaffection towards the Government established by law in India.")
  const [targetText, setTargetText] = useState("BNS Section 150 - Acts endangering sovereignty, unity and integrity of India: Whoever, purposely or knowingly, by words, either spoken or written, or by signs, or by visible representation, or by electronic communication or by use of financial mean, or otherwise, excites or attempts to excite, secession or armed rebellion or subversive activities, or encourages feelings of separatist activities or endangers sovereignty or unity and integrity of India.")
  const [result, setResult] = useState<{conflicts: Array<{severity: string; match: number; title: string; description: string; source: string; target: string}>; overall_confidence: number; ai_analysis: string} | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!sourceText.trim() || !targetText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/conflicts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: sourceText, target_text: targetText })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        conflicts: [{ severity: "Error", match: 0, title: "Connection Error", description: "Could not connect to the backend API.", source: "", target: "" }],
        overall_confidence: 0,
        ai_analysis: "Failed to reach the backend server."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="conflicts-container">
      <div className="conflicts-page-header">
        <h2 className="conflicts-page-title">Conflict Detection Dashboard</h2>
        <p className="conflicts-page-desc">Automated cross-referencing between Indian legal acts to identify potential contradictions and procedural misalignments.</p>
      </div>

      {/* Stats Row */}
      <div className="conflicts-stats-row">
        <div className="conflicts-stat-card stat-error-border">
          <p className="stat-label">High Severity</p>
          <p className="stat-value">{result ? result.conflicts.filter(c => c.severity === "High Risk").length : "—"}</p>
        </div>
        <div className="conflicts-stat-card stat-warning-border">
          <p className="stat-label">Total Conflicts</p>
          <p className="stat-value">{result ? result.conflicts.length : "—"}</p>
        </div>
        <div className="conflicts-stat-card stat-info-border">
          <p className="stat-label">AI Confidence</p>
          <p className="stat-value">{result ? `${result.overall_confidence}%` : "—"}</p>
        </div>
        <div className="conflicts-stat-card">
          <button onClick={handleAnalyze} disabled={isLoading} className="conflicts-analyze-btn">
            <span className="material-symbols-outlined icon-small">compare_arrows</span>
            {isLoading ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="conflicts-input-grid">
        <div className="conflicts-input-panel">
          <div className="conflicts-input-header">
            <span className="material-symbols-outlined">description</span>
            <span className="conflicts-input-label">Source Act / Clause</span>
          </div>
          <textarea
            className="conflicts-textarea"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste the source legal text here..."
            rows={6}
          />
        </div>
        <div className="conflicts-input-panel">
          <div className="conflicts-input-header">
            <span className="material-symbols-outlined">article</span>
            <span className="conflicts-input-label">Target Act / Clause</span>
          </div>
          <textarea
            className="conflicts-textarea"
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            placeholder="Paste the target legal text here..."
            rows={6}
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="conflicts-results-grid">
          {/* Left: Detected Conflicts */}
          <div className="conflicts-list-panel">
            <h3 className="conflicts-list-title">Detected Contradictions</h3>
            <div className="conflicts-list">
              {result.conflicts.map((conflict, idx) => (
                <div key={idx} className="conflict-card">
                  <div className="conflict-card-header">
                    <span className={`conflict-severity-badge ${conflict.severity === 'High Risk' ? 'severity-high' : conflict.severity === 'Medium Risk' ? 'severity-medium' : 'severity-low'}`}>
                      <span className="conflict-severity-dot"></span>
                      {conflict.severity}
                    </span>
                    <span className="conflict-match-badge">{conflict.match}% Match</span>
                  </div>
                  <h4 className="conflict-title">{conflict.title}</h4>
                  <p className="conflict-desc">{conflict.description}</p>
                  <div className="conflict-references">
                    <div className="conflict-ref">
                      <span className="conflict-ref-label">Source</span>
                      <span className="conflict-ref-value">{conflict.source}</span>
                    </div>
                    <span className="material-symbols-outlined conflict-arrow">arrow_forward</span>
                    <div className="conflict-ref">
                      <span className="conflict-ref-label">Target</span>
                      <span className="conflict-ref-value">{conflict.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: AI Analysis */}
          <div className="conflicts-analysis-panel">
            <div className="analysis-panel-header">
              <div className="analysis-icon-box">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h3 className="analysis-title">AI Expert Analysis</h3>
                <p className="analysis-subtitle">Comparative analysis powered by Gemini</p>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="comparison-grid">
              <div className="comparison-side comparison-source">
                <div className="comparison-side-header">
                  <span className="comparison-label">Source Text</span>
                </div>
                <div className="comparison-body">
                  {sourceText.substring(0, 200)}...
                </div>
              </div>
              <div className="comparison-side comparison-target">
                <div className="comparison-side-header">
                  <span className="comparison-label">Target Text</span>
                </div>
                <div className="comparison-body">
                  {targetText.substring(0, 200)}...
                </div>
              </div>
            </div>

            {/* Analysis text */}
            <div className="analysis-content">
              <h4 className="analysis-content-title">
                <span className="material-symbols-outlined icon-small">auto_awesome</span>
                Detailed Analysis
              </h4>
              <p className="analysis-text">{result.ai_analysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="conflicts-loading">
          <div className="conflicts-loading-inner">
            <span className="material-symbols-outlined conflicts-loading-icon">hourglass_top</span>
            <p className="conflicts-loading-text">Analyzing legal texts for contradictions...</p>
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
