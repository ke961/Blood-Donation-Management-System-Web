import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Home.css";

const INITIAL_SAMPLE_REQUESTS = [
  {
    id: "sample-1",
    patient_name: "Sarah Jenkins",
    contact_number: "+1 (555) 234-5678",
    blood_group: "O-",
    hospital: "City Central Emergency Hospital, ICU Room 302",
    quantity: 3,
    urgency: "Critical",
    status: "Pending",
    created_at: "Just now",
  },
  {
    id: "sample-2",
    patient_name: "Robert Chen",
    contact_number: "+1 (555) 876-5432",
    blood_group: "AB+",
    hospital: "St. Jude Trauma Center, Ward B",
    quantity: 2,
    urgency: "Urgent",
    status: "Pending",
    created_at: "25 mins ago",
  },
  {
    id: "sample-3",
    patient_name: "Michael Vance",
    contact_number: "+1 (555) 432-1098",
    blood_group: "A+",
    hospital: "General Memorial Hospital, Surgical Suite 4",
    quantity: 2,
    urgency: "Urgent",
    status: "Approved",
    created_at: "1 hour ago",
  },
  {
    id: "sample-4",
    patient_name: "Elena Rostova",
    contact_number: "+1 (555) 987-6543",
    blood_group: "B-",
    hospital: "Metropolitan Children's Hospital",
    quantity: 1,
    urgency: "Normal",
    status: "Pending",
    created_at: "2 hours ago",
  },
];

function Home() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState("O+");
  const [emergencyRequests, setEmergencyRequests] = useState(INITIAL_SAMPLE_REQUESTS);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalRequest, setActiveModalRequest] = useState(null);

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

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const res = await api.get("/public/emergency-requests", { timeout: 3500 });
      if (res.data && res.data.length > 0) {
        setEmergencyRequests(res.data);
      }
    } catch (err) {
      console.warn("Live backend request fetch timed out or failed, displaying initial emergency list:", err);
    }
  };

  const filteredRequests = emergencyRequests.filter((req) => {
    const matchesGroup =
      selectedFilterGroup === "All" ||
      req.blood_group.toUpperCase() === selectedFilterGroup.toUpperCase();
    const matchesQuery =
      searchQuery === "" ||
      req.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.blood_group.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.patient_name && req.patient_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesQuery;
  });

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
          <a href="#emergency-requests" className="nav-link nav-emergency-highlight">
            Emergency Needs <span className="nav-badge-pulse"></span>
          </a>
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
          <button
            className="btn-hero-secondary"
            onClick={() => {
              const el = document.getElementById("emergency-requests");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            View Urgent Needs 🚨
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

        {/* Live Emergency Requests Section (Available without login/registration) */}
        <div id="emergency-requests" className="emergency-section">
          <div className="section-header">
            <div className="header-badge">
              <span className="live-dot pulse"></span> LIVE EMERGENCY QUEUE
            </div>
            <h2>Immediate Emergency Blood Requests</h2>
            <p>
              Open to the public! View urgent blood groups currently needed in hospitals. If you can help, click respond or register as a donor.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="emergency-controls">
            <div className="group-filter-pills">
              {["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((grp) => (
                <button
                  key={grp}
                  className={`filter-pill ${selectedFilterGroup === grp ? "active" : ""}`}
                  onClick={() => setSelectedFilterGroup(grp)}
                >
                  {grp === "All" ? "All Groups" : grp}
                </button>
              ))}
            </div>

            <div className="search-box-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search hospital, blood group, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Requests Grid */}
          {loadingRequests ? (
            <div className="emergency-loading">
              <div className="spinner"></div>
              <p>Fetching active emergency requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="emergency-empty">
              <span className="empty-icon">🩸</span>
              <h3>No matching emergency requests found</h3>
              <p>Try selecting a different blood group filter or search keyword.</p>
              <button
                className="btn-reset-filters"
                onClick={() => {
                  setSelectedFilterGroup("All");
                  setSearchQuery("");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="emergency-grid">
              {filteredRequests.map((req) => {
                const urgencyLower = (req.urgency || "normal").toLowerCase();
                const isCritical = urgencyLower === "critical" || urgencyLower === "emergency";
                const isUrgent = urgencyLower === "urgent";

                return (
                  <div
                    key={req.id}
                    className={`emergency-card ${isCritical ? "card-critical" : isUrgent ? "card-urgent" : ""}`}
                  >
                    <div className="emergency-card-top">
                      <div className="blood-type-badge">
                        <span className="drop-icon">🩸</span>
                        <span className="blood-type-text">{req.blood_group}</span>
                      </div>
                      <div className={`urgency-badge urgency-${urgencyLower}`}>
                        {isCritical && "🔥 CRITICAL"}
                        {isUrgent && "⚡ URGENT"}
                        {!isCritical && !isUrgent && (req.urgency || "NORMAL")}
                      </div>
                    </div>

                    <div className="emergency-card-body">
                      <h4 className="patient-title">{req.patient_name || "Emergency Patient"}</h4>
                      <div className="hospital-info">
                        <span className="info-icon">🏥</span>
                        <span>{req.hospital}</span>
                      </div>

                      <div className="request-details-row">
                        <div className="detail-tag">
                          <span className="tag-label">Needed:</span>
                          <span className="tag-val">{req.quantity} {req.quantity === 1 ? "Unit" : "Units"}</span>
                        </div>
                        <div className="detail-tag">
                          <span className="tag-label">Time:</span>
                          <span className="tag-val">{req.created_at || "Recent"}</span>
                        </div>
                      </div>

                      {req.contact_number && (
                        <div className="contact-preview">
                          <span className="info-icon">📞</span>
                          <span className="contact-num">{req.contact_number}</span>
                        </div>
                      )}
                    </div>

                    <div className="emergency-card-footer">
                      <button
                        className="btn-respond-request"
                        onClick={() => setActiveModalRequest(req)}
                      >
                        Respond & Save Life ❤️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Response Action Modal */}
      {activeModalRequest && (
        <div className="modal-backdrop" onClick={() => setActiveModalRequest(null)}>
          <div className="emergency-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveModalRequest(null)}>
              ✕
            </button>

            <div className="modal-header">
              <div className="modal-blood-badge">
                <span>🩸</span>
                <span className="modal-blood-type">{activeModalRequest.blood_group}</span>
              </div>
              <div>
                <h3>Emergency Request Details</h3>
                <span className={`modal-urgency-tag urgency-${(activeModalRequest.urgency || "normal").toLowerCase()}`}>
                  {activeModalRequest.urgency || "Normal"} Priority
                </span>
              </div>
            </div>

            <div className="modal-body-info">
              <div className="info-row">
                <span className="label">Patient Name:</span>
                <span className="value">{activeModalRequest.patient_name || "Emergency Patient"}</span>
              </div>
              <div className="info-row">
                <span className="label">Hospital / Center:</span>
                <span className="value">{activeModalRequest.hospital}</span>
              </div>
              <div className="info-row">
                <span className="label">Units Needed:</span>
                <span className="value highlight">{activeModalRequest.quantity} Unit(s)</span>
              </div>
              <div className="info-row">
                <span className="label">Contact Phone:</span>
                <span className="value">{activeModalRequest.contact_number || "Contact Hospital"}</span>
              </div>
            </div>

            <div className="modal-notice">
              <p>
                💡 <strong>Public Access Notice:</strong> To officially volunteer and confirm your blood donation commitment for this patient, please register as a donor or log in.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-primary"
                onClick={() => {
                  setActiveModalRequest(null);
                  navigate("/register", { state: { targetRequest: activeModalRequest } });
                }}
              >
                Register as Donor Now ❤️
              </button>

              <button
                className="btn-modal-secondary"
                onClick={() => {
                  setActiveModalRequest(null);
                  navigate("/login", { state: { targetRequest: activeModalRequest } });
                }}
              >
                Already a Donor? Log In
              </button>

              {activeModalRequest.contact_number && (
                <a
                  href={`tel:${activeModalRequest.contact_number}`}
                  className="btn-modal-call"
                >
                  Call Hotline Direct 📞
                </a>
              )}
            </div>
          </div>
        </div>
      )}

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

