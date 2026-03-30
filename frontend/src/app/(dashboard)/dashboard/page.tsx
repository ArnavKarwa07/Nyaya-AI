"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

type UserStats = {
  total_queries: number;
  recent_queries: Array<{id: number; query: string; response: string; confidence: number; created_at: string}>;
};

export default function DashboardPage() {
  const { userId } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/stats/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [userId]);

  const totalQueries = stats?.total_queries ?? 0;
  const recentQueries = stats?.recent_queries ?? [];

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <section className="dashboard-hero-grid">
        <div className="hero-eval-card">
          <div className="hero-eval-content">
            <p className="kicker-light">Welcome back, {userId}</p>
            <h2 className="hero-eval-title">Your Legal Research</h2>
            <div className="hero-eval-metric">
              <span className="metric-value">{totalQueries}<span className="metric-symbol"> queries</span></span>
            </div>
          </div>
          <div className="hero-eval-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(totalQueries * 2, 100)}%` }}></div>
            </div>
            <p className="progress-caption">
              {totalQueries === 0 ? "Start your first research query to begin" : `${totalQueries} legal queries analyzed by NyayaLens AI`}
            </p>
          </div>
          <div className="hero-eval-glow"></div>
        </div>

        <div className="insights-bento">
          <Link href="/conflicts" className="insight-card error-themed">
            <div className="insight-header">
              <span className="material-symbols-outlined insight-icon" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span className="insight-badge">Conflict Detection</span>
            </div>
            <h3 className="insight-title">Detect Conflicts</h3>
            <p className="insight-desc">Compare IPC and BNS provisions to find contradictions and misalignments.</p>
          </Link>
          <Link href="/amendments" className="insight-card info-themed">
            <div className="insight-header">
              <span className="material-symbols-outlined insight-icon" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              <span className="insight-badge">Amendment Tracker</span>
            </div>
            <h3 className="insight-title">Track Amendments</h3>
            <p className="insight-desc">Compare old and new versions of legal documents to identify changes.</p>
          </Link>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="action-section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="actions-grid">
          <Link href="/chat" className="action-card group">
            <div className="action-card-inner">
              <div className="action-icon-box secondary-themed">
                <span className="material-symbols-outlined icon-large">chat_bubble_outline</span>
              </div>
              <div className="action-text">
                <h3 className="action-title">Ask Legal Query</h3>
                <p className="action-desc">Get AI-powered answers about IPC, BNS, Supreme Court precedents, and Indian legal principles.</p>
              </div>
              <span className="material-symbols-outlined action-arrow">arrow_forward</span>
            </div>
          </Link>
          <Link href="/conflicts" className="action-card group">
            <div className="action-card-inner">
              <div className="action-icon-box tertiary-themed">
                <span className="material-symbols-outlined icon-large">compare_arrows</span>
              </div>
              <div className="action-text">
                <h3 className="action-title">Run Conflict Analysis</h3>
                <p className="action-desc">Compare legislative provisions across IPC and BNS to detect contradictions and overlaps.</p>
              </div>
              <span className="material-symbols-outlined action-arrow">arrow_forward</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Queries Table */}
      <section className="table-section">
        <div className="table-header-bar">
          <h2 className="section-title">Recent Research</h2>
        </div>
        <div className="table-responsive">
          {isLoading ? (
            <div className="empty-state">
              <span className="material-symbols-outlined empty-icon">hourglass_top</span>
              <p className="empty-text">Loading your research history...</p>
            </div>
          ) : recentQueries.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined empty-icon">search</span>
              <h3 className="empty-title">No research yet</h3>
              <p className="empty-text">Head to the AI Intelligence page to start your first legal query.</p>
              <Link href="/chat" className="btn-primary" style={{ marginTop: '1rem' }}>Start Research</Link>
            </div>
          ) : (
            <table className="research-table">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Confidence</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentQueries.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <div className="file-name-cell">
                        <span className="material-symbols-outlined icon-primary">psychology</span>
                        <span className="file-name">{q.query}</span>
                      </div>
                    </td>
                    <td>
                      <div className="clauses-cell">
                        <div className={`dot-indicator ${q.confidence > 80 ? 'dot-tertiary' : 'dot-error'}`}></div>
                        <span className="clauses-text">{q.confidence}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="time-text">{q.created_at ? new Date(q.created_at).toLocaleDateString() : "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
