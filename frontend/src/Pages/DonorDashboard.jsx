import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { createRealtimeConnection } from "../services/websocket";
import "./DonorDashboard.css";

function DonorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, requests, donations, profile

  // Stats & User Data
  const [dashboardData, setDashboardData] = useState({
    full_name: "",
    blood_group: "",
    is_available: true,
    total_donations: 0,
    completed_donations: 0,
    matching_requests: 0,
    phone: "",
    address: "",
  });

  const [availableRequests, setAvailableRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    blood_group: "",
    gender: "Male",
    address: "",
    is_available: true,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    } else if (activeTab === "donations") {
      fetchMyDonations();
    } else if (activeTab === "profile") {
      fetchProfile();
    }
  }, [activeTab, filterBloodGroup]);

  // Real-time WebSocket listener
  useEffect(() => {
    const cleanup = createRealtimeConnection((message) => {
      const t = message.type;
      if (
        t === "request_created" ||
        t === "request_updated" ||
        t === "request_deleted" ||
        t === "donation_created" ||
        t === "donation_status_changed" ||
        t === "donation_deleted" ||
        t === "donor_availability_changed"
      ) {
        fetchDashboardData();
        if (activeTab === "requests") fetchRequests();
        if (activeTab === "donations") fetchMyDonations();
      }
    });
    return cleanup;
  }, [activeTab, filterBloodGroup]);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/donor/dashboard");
      setDashboardData(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const url = filterBloodGroup
        ? `/donor/requests?blood_group=${encodeURIComponent(filterBloodGroup)}`
        : "/donor/requests";
      const res = await api.get(url);
      setAvailableRequests(res.data);
    } catch (err) {
      showAlert("Failed to load blood requests.", "error");
    }
  };

  const fetchMyDonations = async () => {
    try {
      const res = await api.get("/donor/donations");
      setMyDonations(res.data);
    } catch (err) {
      showAlert("Failed to load donation history.", "error");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/donor/profile");
      setProfile(res.data);
    } catch (err) {
      showAlert("Failed to load profile.", "error");
    }
  };

  const toggleAvailability = async () => {
    try {
      const newStatus = !dashboardData.is_available;
      await api.put(`/donor/availability?is_available=${newStatus}`);
      setDashboardData((prev) => ({ ...prev, is_available: newStatus }));
      setProfile((prev) => ({ ...prev, is_available: newStatus }));
      showAlert(`Availability set to ${newStatus ? "Available to Donate" : "Unavailable"}`);
    } catch (err) {
      showAlert("Could not update availability.", "error");
    }
  };

  const handleDonateRequest = async (requestId) => {
    try {
      const res = await api.post(`/donor/donate/${requestId}`);
      showAlert(res.data.message || "Thank you for volunteering!");
      fetchRequests();
      fetchDashboardData();
    } catch (err) {
      showAlert(
        err.response?.data?.detail || "Failed to submit donation response.",
        "error"
      );
    }
  };

  const handleUpdateDonationStatus = async (donationId, status) => {
    try {
      await api.put(`/donor/donations/${donationId}/status`, { status });
      showAlert(`Donation status updated to ${status}`);
      fetchMyDonations();
      fetchDashboardData();
    } catch (err) {
      showAlert("Failed to update status.", "error");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/donor/profile", profile);
      showAlert("Profile updated successfully!");
      fetchDashboardData();
    } catch (err) {
      showAlert("Failed to update profile.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="donor-dashboard-container">
        <div className="loading-spinner">
          <p>🩸 Loading Donor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-dashboard-container">
      {/* Header Bar */}
      <header className="donor-header">
        <div className="header-brand">
          <h1>🩸 Donor Portal</h1>
          <p>Welcome back, <strong>{dashboardData.full_name || "Hero Donor"}</strong> ({dashboardData.blood_group || "Blood Group Unspecified"})</p>
        </div>

        <div className="header-actions">
          <div
            className={`availability-badge ${dashboardData.is_available ? "available" : "unavailable"}`}
            onClick={toggleAvailability}
            title="Click to toggle availability"
          >
            <span>{dashboardData.is_available ? "● Available to Donate" : "○ Currently Unavailable"}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="donor-nav-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          🩸 Available Requests ({dashboardData.matching_requests} Matched)
        </button>
        <button
          className={`tab-btn ${activeTab === "donations" ? "active" : ""}`}
          onClick={() => setActiveTab("donations")}
        >
          📜 My Donations
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 My Profile
        </button>
      </nav>

      {/* Body Content */}
      <main className="donor-body">
        {alert.message && (
          <div className={`alert-message ${alert.type}`}>
            <span>{alert.message}</span>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }} onClick={() => setAlert({ message: "", type: "" })}>×</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Blood Group</h3>
                  <div className="stat-value">{dashboardData.blood_group || "N/A"}</div>
                </div>
                <div className="stat-icon red">🩸</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Matching Urgent Requests</h3>
                  <div className="stat-value">{dashboardData.matching_requests}</div>
                </div>
                <div className="stat-icon blue">⚡</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Donations Made</h3>
                  <div className="stat-value">{dashboardData.total_donations}</div>
                </div>
                <div className="stat-icon green">❤️</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Completed Donations</h3>
                  <div className="stat-value">{dashboardData.completed_donations}</div>
                </div>
                <div className="stat-icon purple">🏆</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Quick Actions & Readiness</h2>
              </div>
              <p>
                Status: <strong>{dashboardData.is_available ? "Active Donor Ready for Donation" : "Paused / Not Available"}</strong>
              </p>
              <p style={{ color: "#64748b", fontSize: "14px" }}>
                Keep your status active to let patients and hospital admins reach out when your blood group is needed urgently.
              </p>
              <button
                className="submit-btn"
                onClick={() => setActiveTab("requests")}
                style={{ marginTop: "12px" }}
              >
                View Live Blood Requests →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: AVAILABLE REQUESTS */}
        {activeTab === "requests" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Active Blood Requests</h2>
              <select
                value={filterBloodGroup}
                onChange={(e) => setFilterBloodGroup(e.target.value)}
                style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            {availableRequests.length === 0 ? (
              <div className="empty-state">
                <span>🩸</span>
                <p>No active blood requests currently found.</p>
              </div>
            ) : (
              <div className="requests-grid">
                {availableRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`request-card ${req.is_match ? "matched-card" : ""}`}
                  >
                    <div>
                      <div className="card-top">
                        <span className="blood-group-badge">{req.blood_group}</span>
                        <span className={`urgency-badge ${req.urgency.toLowerCase()}`}>
                          {req.urgency}
                        </span>
                      </div>

                      {req.is_match && (
                        <span className="match-tag">⭐ Matches Your Blood Group</span>
                      )}

                      <div className="card-details">
                        <p><strong>Hospital:</strong> {req.hospital}</p>
                        <p><strong>Patient:</strong> {req.patient_name}</p>
                        <p><strong>Units Needed:</strong> {req.quantity} Bag(s)</p>
                        <p><strong>Contact:</strong> {req.contact_number || "N/A"}</p>
                        <p><strong>Posted:</strong> {req.created_at || "Recent"}</p>
                      </div>
                    </div>

                    <button
                      className="donate-action-btn"
                      onClick={() => handleDonateRequest(req.id)}
                      disabled={req.status === "Completed" || !dashboardData.is_available}
                    >
                      {!dashboardData.is_available
                        ? "Mark Yourself Available to Donate"
                        : "Volunteer to Donate"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY DONATIONS */}
        {activeTab === "donations" && (
          <div className="section-card">
            <div className="section-header">
              <h2>My Donation History & Active Commitments</h2>
            </div>

            {myDonations.length === 0 ? (
              <div className="empty-state">
                <span>📜</span>
                <p>You haven't volunteered for any donations yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Hospital</th>
                      <th>Blood Group</th>
                      <th>Quantity</th>
                      <th>Date Offered</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDonations.map((d) => (
                      <tr key={d.id}>
                        <td>#{d.request_id}</td>
                        <td>{d.hospital}</td>
                        <td><strong>{d.blood_group}</strong></td>
                        <td>{d.quantity} Bag(s)</td>
                        <td>{d.donation_date}</td>
                        <td>
                          <span className={`status-tag ${d.status.toLowerCase()}`}>
                            {d.status}
                          </span>
                        </td>
                        <td>
                          {d.status === "Pending" && (
                            <>
                              <button
                                className="action-btn-sm complete"
                                onClick={() => handleUpdateDonationStatus(d.id, "Completed")}
                              >
                                Mark Completed
                              </button>
                              <button
                                className="action-btn-sm cancel"
                                onClick={() => handleUpdateDonationStatus(d.id, "Cancelled")}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {d.status === "Completed" && <span style={{ color: "#16a34a" }}>✓ Completed</span>}
                          {d.status === "Cancelled" && <span style={{ color: "#ef4444" }}>Cancelled</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === "profile" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Donor Profile Settings</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={profile.blood_group || "O+"}
                  onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  value={profile.gender || "Male"}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Address / Location</label>
                <input
                  type="text"
                  value={profile.address || ""}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={profile.is_available}
                    onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })}
                  />
                  I am currently available to respond to emergency blood donation requests.
                </label>
              </div>

              <button type="submit" className="submit-btn">
                Save Profile Changes
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default DonorDashboard;
