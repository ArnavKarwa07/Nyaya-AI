import Link from 'next/link';
import LoginButtons from '@/components/LoginButtons';

export default function LandingPage() {
  return (
    <>
      {/* TopAppBar */}
      <header className="app-header">
        <div className="header-logo-group">
          <span className="logo-text">NyayaLens</span>
          <nav className="header-nav">
            <Link className="nav-link active" href="#">Workspaces</Link>
            <Link className="nav-link" href="#">Intelligence</Link>
            <Link className="nav-link" href="#">Library</Link>
          </nav>
        </div>
        <div className="header-actions">
          <div className="search-container hidden-mobile">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="Search precedents..." type="text"/>
          </div>
          <LoginButtons />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="material-symbols-outlined">gavel</span>
                India's First Legal Reasoning AI
            </div>
            <h1 className="hero-title">
              The Digital Jurist for <span className="highlight-italic">Indian Law.</span>
            </h1>
            <p className="hero-subtitle">
              AI that reasons over Indian legal documents with precision and trust. Built specifically for the complexities of the Indian judicial system.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn-primary-large">
                Start Researching
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <button className="btn-secondary-large">
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Hero Abstract Visual */}
          <div className="hero-visual-container">
            <div className="hero-visual-frame">
              <img alt="Legal library interior" className="hero-image" data-alt="Modern law library with blurred bookshelves and warm lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnyI_wTou2nRlaGvBucTnKkGgVF6_P22mwfutNw9rNpG6R2XGRKtA_C656LeBgGLGdfbvBGceOstbBZ-a01_rivT-vOiUVi48Nz5Ivn_sR7F9u8F7zcAhmOxucnUBZHiC9mu_oEcNK9FE8DH9qdgPGibRj6-UXyH05wq4EyTms9NNt2i4hv-CI7Ja-WPUnej7M6-Z09lfjy65Wy6IGlY10v2kL5Cu3I4mzg1EOpV1uXKkWmxt-00fZoBHYCIQB6xr7Q4UdR8qNQhA"/>
              <div className="hero-gradient-overlay"></div>
              <div className="hero-visual-text">
                <span className="material-symbols-outlined icon-large">psychology</span>
                <p className="visual-title">Context-Aware Neural Search</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="features-section">
          <div className="features-container">
            <div className="features-header">
              <h2 className="section-title">Precise. Structured. Authoritative.</h2>
              <p className="section-subtitle">Our suite of tools is designed to handle the nuances of Section IPC, Constitution of India, and sprawling case laws.</p>
            </div>
            
            <div className="bento-grid">
              {/* Feature 1: Clause-Aware Chat */}
              <div className="bento-card col-span-7">
                <div className="bento-icon-box bg-secondary-fixed">
                  <span className="material-symbols-outlined text-secondary">chat_bubble</span>
                </div>
                <h3 className="bento-title">Clause-Aware Chat</h3>
                <p className="bento-desc">Interrogate complex contracts and citations. Our AI doesn't just summarize; it cross-references every answer with legal precedents from the Supreme Court.</p>
                <div className="chat-preview-box">
                  <div className="chat-message-row">
                    <div className="chat-avatar">AI</div>
                    <div className="chat-bubble">
                      "Under Section 138 of the NI Act, the notice period is strictly 30 days..."
                    </div>
                  </div>
                  <div className="chat-reference">Reference: K. Bhaskaran vs. Sankaran Vaidhyan Balan (1999)</div>
                </div>
              </div>

              {/* Feature 2: Conflict Detection */}
              <div className="bento-card col-span-5">
                <div className="bento-icon-box bg-error-container">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h3 className="bento-title">Conflict Detection</h3>
                <p className="bento-desc">Automatically flag contradictory clauses and non-compliance with current Indian legislation.</p>
                <div className="alerts-list">
                  <div className="alert-item error-alert">
                    <span className="material-symbols-outlined icon-small">priority_high</span>
                    <span className="alert-badge">High Risk</span>
                    <span className="alert-text">Indemnity clause violates IT Act, 2000.</span>
                  </div>
                  <div className="alert-item info-alert">
                    <span className="material-symbols-outlined icon-small">info</span>
                    <span className="alert-badge info">Draft Alert</span>
                    <span className="alert-text">Vague arbitration venue definition.</span>
                  </div>
                </div>
              </div>

              {/* Feature 3: Knowledge Graph */}
              <div className="bento-card col-span-12 flex-row">
                <div className="graph-text-side">
                  <div className="bento-icon-box bg-tertiary-fixed">
                    <span className="material-symbols-outlined text-tertiary">account_tree</span>
                  </div>
                  <h3 className="bento-title">The Nyaya Knowledge Graph</h3>
                  <p className="bento-desc">Visualize the web of citations. See how one High Court judgment influences others across jurisdictions in a single, interactive map of law.</p>
                  <button className="text-link-btn">
                    Explore the Graph <span className="material-symbols-outlined icon-small">arrow_outward</span>
                  </button>
                </div>
                <div className="graph-visual-side">
                  <div className="graph-ambient"></div>
                  <div className="graph-nodes-container">
                    <div className="graph-node center-node">Supreme<br/>Court</div>
                    <div className="graph-node top-node">HC Bombay</div>
                    <div className="graph-node bottom-node">HC Delhi</div>
                    <svg className="graph-lines" xmlns="http://www.w3.org/2000/svg">
                      <line x1="25%" x2="50%" y1="25%" y2="50%"></line>
                      <line x1="66%" x2="50%" y1="75%" y2="50%"></line>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="trust-section">
          <div className="trust-container">
            <span className="trust-kicker">Professional Standard</span>
            <h2 className="section-title large">Built for Legal Experts. <br/>Powered by Deep Reasoning.</h2>
            <p className="trust-quote">"NyayaLens doesn't just process text; it respects the gravity of the legal record. It's the difference between a search engine and a digital clerk."</p>
            <div className="trust-pillars">
              <div className="pillar">
                <span className="material-symbols-outlined">verified_user</span>
                <span className="pillar-text">Bar Council Compliant</span>
              </div>
              <div className="pillar">
                <span className="material-symbols-outlined">lock</span>
                <span className="pillar-text">Air-Gapped Data</span>
              </div>
              <div className="pillar">
                <span className="material-symbols-outlined">history_edu</span>
                <span className="pillar-text">Supreme Records</span>
              </div>
              <div className="pillar">
                <span className="material-symbols-outlined">balance</span>
                <span className="pillar-text">Fairness Audited</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="cta-section">
          <div className="cta-card">
            <div className="cta-glow"></div>
            <h2 className="cta-title">Experience the future of <br/>Indian legal research.</h2>
            <div className="cta-actions">
              <button className="btn-cta-primary">Join the Waitlist</button>
              <button className="btn-cta-secondary">Book a Consultation</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">NyayaLens</span>
            <p className="footer-desc">
              Elevating the practice of law through jurisdictional intelligence and semantic reasoning.
            </p>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-heading">Product</h4>
            <ul>
              <li><Link href="#">Intelligence</Link></li>
              <li><Link href="#">Clause Extraction</Link></li>
              <li><Link href="#">Knowledge Graph</Link></li>
              <li><Link href="#">Security</Link></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-heading">Resources</h4>
            <ul>
              <li><Link href="#">Legal Blog</Link></li>
              <li><Link href="#">Documentation</Link></li>
              <li><Link href="#">API Reference</Link></li>
              <li><Link href="#">Success Stories</Link></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-heading">Company</h4>
            <ul>
              <li><Link href="#">About</Link></li>
              <li><Link href="#">Ethics</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 NyayaLens AI. All rights reserved. Crafted for the Indian Bar.</p>
          <div className="footer-legal">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Cookie Settings</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
