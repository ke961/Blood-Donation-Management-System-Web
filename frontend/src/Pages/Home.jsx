import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState("O+");

  const bloodCompatibility = {
    "A+": { giveTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
    "A-": { giveTo: "A+, A-, AB+, AB-", receiveFrom: "A-, O-" },
    "B+": { giveTo: "B+, AB+", receiveFrom: "B+, B-, O+, O-" },
    "B-": { giveTo: "B+, B-, AB+, AB-", receiveFrom: "B-, O-" },
    "AB+": { giveTo: "AB+ (Universal Recipient)", receiveFrom: "All Blood Types" },
    "AB-": { giveTo: "AB+, AB-", receiveFrom: "AB-, A-, B-, O-" },
    "O+": { giveTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
    "O-": { giveTo: "All Blood Types (Universal Donor)", receiveFrom: "O- Only" },
  };

  return (
    <div className="home-container">
      {/* Background ambient glow overlays */}
      <div className="home-bg-glow glow-top"></div>
      <div className="home-bg-glow glow-bottom"></div>

      {/* Top Navbar */}
      <nav className="home-navbar">
        <div className="home-logo" onClick={() => navigate("/")}>
          <div className="logo-icon-wrap">
            <span className="blood-icon">🩸</span>
          </div>
          <span className="logo-text">LifeFlow</span>
        </div>

        <div className="home-nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#compatibility" className="nav-link">Compatibility</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
        </div>

        <div className="home-nav-actions">
          <button className="btn-nav-login" onClick={() => navigate("/login")}>
            Log in
          </button>
          <button className="btn-nav-register" onClick={() => navigate("/register")}>
            Register Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-content">
        <div className="hero-badge">
          <span className="badge-pulse"></span> Emergency Blood Matching Platform
        </div>

        <h1 className="hero-title">
          Connecting <span className="highlight-text">Blood Donors</span> <br />
          with Patients in Real-Time
        </h1>

        <p className="hero-subtitle">
          A modern, life-saving digital bridge between voluntary blood donors, patients in critical need, and hospital administrators.
        </p>

        <div className="hero-cta-buttons">
          <button className="btn-hero-primary" onClick={() => navigate("/register")}>
            Become a Donor ❤️
          </button>
          <button className="btn-hero-secondary" onClick={() => navigate("/login")}>
            Request Blood Urgently 🩸
          </button>
        </div>

        {/* Real-time Impact Metrics Banner */}
        <div className="impact-banner">
          <div className="metric-item">
            <span className="metric-number">2,500+</span>
            <span className="metric-label">Registered Donors</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-number">1,400+</span>
            <span className="metric-label">Lives Saved</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-number">100%</span>
            <span className="metric-label">Verified Requests</span>
          </div>
          <div className="metric-divider"></div>
          <div className="metric-item">
            <span className="metric-number">&lt; 15 Mins</span>
            <span className="metric-label">Avg Response Time</span>
          </div>
        </div>

        {/* Quick Blood Group Compatibility Widget */}
        <div id="compatibility" className="compatibility-widget">
          <div className="widget-header">
            <h3>🩸 Quick Blood Compatibility Finder</h3>
            <p>Select a blood group to see donor match rules:</p>
          </div>

          <div className="blood-pills-row">
            {Object.keys(bloodCompatibility).map((group) => (
              <button
                key={group}
                className={`blood-pill ${selectedGroup === group ? "active" : ""}`}
                onClick={() => setSelectedGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="compatibility-info">
            <div className="info-box">
              <span className="info-title">Can Donate To:</span>
              <span className="info-val">{bloodCompatibility[selectedGroup].giveTo}</span>
            </div>
            <div className="info-box">
              <span className="info-title">Can Receive From:</span>
              <span className="info-val">{bloodCompatibility[selectedGroup].receiveFrom}</span>
            </div>
          </div>
        </div>

        {/* 3 Main Role Feature Cards */}
        <div id="features" className="home-cards-grid">
          <div className="feature-card" onClick={() => navigate("/login")}>
            <div className="card-badge admin-badge">System Control</div>
            <div className="card-icon">🛡️</div>
            <h3>Admin Management</h3>
            <p>
              Complete oversight of registered donors, patient requests, hospital allocations, and real-time donation analytics.
            </p>
            <span className="card-action-link">Access Dashboard →</span>
          </div>

          <div className="feature-card highlighted-card" onClick={() => navigate("/register")}>
            <div className="card-badge donor-badge">Life Saver</div>
            <div className="card-icon">❤️</div>
            <h3>Become a Donor</h3>
            <p>
              Register your blood type, toggle donation availability, and receive real-time notifications for nearby hospital emergencies.
            </p>
            <span className="card-action-link">Register as Donor →</span>
          </div>

          <div className="feature-card" onClick={() => navigate("/register")}>
            <div className="card-badge patient-badge">Emergency Care</div>
            <div className="card-icon">🩸</div>
            <h3>Request Blood</h3>
            <p>
              Patients and emergency guardians can submit blood requests instantly to get matched with active donors in minutes.
            </p>
            <span className="card-action-link">Post Blood Request →</span>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="how-it-works-section">
          <h2>How LifeFlow Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h4>Create Account</h4>
              <p>Register as a donor or patient in less than 2 minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h4>Post or Find Request</h4>
              <p>Instant matching based on blood compatibility & location.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h4>Save a Life</h4>
              <p>Connect directly and complete the life-saving donation.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <p>© 2026 LifeFlow Blood Donation Management System. All rights reserved.</p>
          <div className="footer-links">
            <span onClick={() => navigate("/login")}>Login</span>
            <span>•</span>
            <span onClick={() => navigate("/register")}>Register</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
