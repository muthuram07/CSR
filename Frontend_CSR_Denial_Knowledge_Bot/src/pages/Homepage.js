import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/animations.css';
import '../styles/responsive.css';

function Homepage() {
  const { user, logout } = useAuth();

  return (
    <div className="homepage-container">
      {/* Professional Header */}
      <header className="professional-header">
        <div className="header-container">
          <div className="brand-section">
            <Link to="/" className="company-logo">
              <span className="logo-symbol">🤖</span>
              <div className="brand-text">
                <h1 className="company-name">CSR Denial Knowledge Bot</h1>
                <p className="company-tagline">Intelligent Denial Code & Plan Coverage Assistant</p>
              </div>
            </Link>
          </div>
          
          <nav className="main-navigation">
            {user ? (
              <div className="auth-nav">
                <span className="user-welcome">Welcome, {user.username}!</span>
                <Link to="/chatbot" className="nav-btn primary">Chat Bot</Link>
                <button onClick={logout} className="nav-btn secondary">Logout</button>
              </div>
            ) : (
              <div className="guest-nav">
                <Link to="/signin" className="nav-btn secondary">Sign In</Link>
                <Link to="/signup" className="nav-btn primary">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Enterprise Hero Section */}
      <section className="enterprise-hero">
        <div className="hero-background-pattern">
          <div className="background-pattern"></div>
          <div className="floating-elements">
            <div className="element element-1"></div>
            <div className="element element-2"></div>
            <div className="element element-3"></div>
          </div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-icon">🚀</span>
              <span>AI-Powered CSR Assistant</span>
            </div>
            
            <h1 className="hero-title">
              Instant Answers for <span className="highlight">Denial Codes & Plan Coverage</span>
            </h1>
            
            <p className="hero-description">
              Get immediate, accurate information about denial codes, member plans, and coverage details 
              with our intelligent AI assistant trained on your specific data.
            </p>
            
            <div className="hero-actions">
              {user ? (
                <Link to="/chatbot" className="cta-primary hover-lift">
                  <span>Open Chat Bot</span>
                  <span className="btn-arrow">→</span>
                </Link>
              ) : (
                <Link to="/signup" className="cta-primary hover-lift">
                  <span>Start Now</span>
                  <span className="btn-arrow">→</span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="platform-preview">
              <div className="preview-header">
                <div className="preview-controls">
                  <div className="control red"></div>
                  <div className="control yellow"></div>
                  <div className="control green"></div>
                </div>
                <div className="preview-title">AI Assistant Preview</div>
              </div>
              <div className="preview-content">
                <div className="chat-preview">
                  <div className="chat-message user">
                    <div className="message-avatar"></div>
                    <div className="message-content">
                      <p className="message-text">What does denial code CO-45 mean?</p>
                    </div>
                  </div>
                  <div className="chat-message bot">
                    <div className="message-avatar"></div>
                    <div className="message-content">
                      <p className="message-text">🔍 CO-45: Charge exceeds fee schedule/maximum allowable amount. Check payer fee schedule or submit an appeal with documentation.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CSR Benefits Section */}
      <section className="enterprise-features">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Transform Your CSR Operations</h2>
            <p className="section-subtitle">
              Powerful features that revolutionize how your team handles customer inquiries
            </p>
          </div>
          
          <div className="features-grid csr-benefits">
            <div className="feature-card premium hover-lift slide-in">
              <div className="feature-header">
                <div className="feature-icon">⚡</div>
                <div className="feature-badge">Speed</div>
              </div>
              <h3 className="feature-title">Lightning Fast Responses</h3>
              <p className="feature-description">
                Reduce average call handling time by 60% with instant AI-powered answers to complex denial codes and coverage questions.
              </p>
              <div className="feature-metrics">
                <span className="metric">-60s</span>
                <span className="metric-label">Avg. Call Time</span>
              </div>
            </div>
            
            <div className="feature-card premium hover-lift slide-in">
              <div className="feature-header">
                <div className="feature-icon">🎯</div>
                <div className="feature-badge">Precision</div>
              </div>
              <h3 className="feature-title">99.5% Accuracy Rate</h3>
              <p className="feature-description">
                Eliminate human errors with AI-powered lookups that provide consistent, accurate information every single time.
              </p>
              <div className="feature-metrics">
                <span className="metric">99.5%</span>
                <span className="metric-label">Accuracy</span>
              </div>
            </div>
            
            <div className="feature-card premium hover-lift slide-in">
              <div className="feature-header">
                <div className="feature-icon">📚</div>
                <div className="feature-badge">Learning</div>
              </div>
              <h3 className="feature-title">Smart Training System</h3>
              <p className="feature-description">
                New CSR agents become 80% more productive in their first week with intelligent assistance and contextual guidance.
              </p>
              <div className="feature-metrics">
                <span className="metric">-80%</span>
                <span className="metric-label">Training Time</span>
              </div>
            </div>
            
            <div className="feature-card premium centered-feature hover-lift slide-in">
              <div className="feature-header">
                <div className="feature-icon">💎</div>
                <div className="feature-badge">Excellence</div>
              </div>
              <h3 className="feature-title">Customer Satisfaction</h3>
              <p className="feature-description">
                Achieve 95%+ customer satisfaction scores with confident, knowledgeable responses that build trust and loyalty.
              </p>
              <div className="feature-metrics">
                <span className="metric">95%+</span>
                <span className="metric-label">CSAT Score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Statistics Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Trusted by Leading Healthcare Organizations</h2>
            <p className="section-subtitle">
              Real-world impact from teams using our AI-powered assistant
            </p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card hover-lift scale-in">
              <div className="stat-icon">🏥</div>
              <div className="stat-number">50K+</div>
              <div className="stat-label">Daily Queries Resolved</div>
            </div>
            <div className="stat-card hover-lift scale-in">
              <div className="stat-icon">⏱️</div>
              <div className="stat-number">3.2s</div>
              <div className="stat-label">Average Response Time</div>
            </div>
            <div className="stat-card hover-lift scale-in">
              <div className="stat-icon">👥</div>
              <div className="stat-number">10K+</div>
              <div className="stat-label">CSR Agents Empowered</div>
            </div>
            <div className="stat-card hover-lift scale-in">
              <div className="stat-icon">🌟</div>
              <div className="stat-number">4.9/5</div>
              <div className="stat-label">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Simple process from your question to instant results
            </p>
          </div>
          
          <div className="process-flow">
            <div className="process-step">
              <div className="step-indicator">
                <div className="step-number">1</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Ask Your Question</h3>
                <p className="step-description">
                  Type your question in natural language - ask about denial codes, plan coverage, or member information.
                </p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-indicator">
                <div className="step-number">2</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">AI Processing</h3>
                <p className="step-description">
                  Our trained AI model analyzes your query and searches through denial codes, member data, and plan coverage information.
                </p>
              </div>
            </div>
            
            <div className="process-step">
              <div className="step-indicator">
                <div className="step-number">3</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">Get Instant Results</h3>
                <p className="step-description">
                  Receive accurate, detailed answers with all relevant information including codes, descriptions, and actionable guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="professional-footer">
        <p>&copy; 2024 AI Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Homepage;