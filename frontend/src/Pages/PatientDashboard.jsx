import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, requests, new-request, donors

  // Patient user state
  const [patientUser, setPatientUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [myRequests, setMyRequests] = useState([]);
  const [donorsList, setDonorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [bloodFilter, setBloodFilter] = useState("");

  // New Request Form State
  const [newRequest, setNewRequest] = useState({
    patient_name: patientUser.full_name || "",
    contact_number: patientUser.phone || "",
    blood_group: patientUser.blood_group || "O+",
    hospital: "",
    quantity: 1,
    urgency: "Normal",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchMyRequests();
    } else if (activeTab === "donors") {
      fetchDonors();
    }
  }, [activeTab, bloodFilter]);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await fetchMyRequests();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get("/patient/requests");
      setMyRequests(res.data);
    } catch (err) {
      showAlert("Failed to load blood requests.", "error");
    }
  };

  const fetchDonors = async () => {
    try {
      const url = bloodFilter
        ? `/admin/donors?blood_group=${encodeURIComponent(bloodFilter)}`
        : "/admin/donors";
      const res = await api.get(url);
      setDonorsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch available donors.", "error");
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post("/patient/requests", newRequest);
      showAlert(res.data.message || "Blood request created successfully!");
      setNewRequest({
        patient_name: patientUser.full_name || "",
        contact_number: patientUser.phone || "",
        blood_group: patientUser.blood_group || "O+",
        hospital: "",
        quantity: 1,
        urgency: "Normal",
      });
      fetchMyRequests();
      setActiveTab("requests");
    } catch (err) {
      showAlert(
        err.response?.data?.detail || "Failed to submit blood request.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const pendingCount = myRequests.filter((r) => r.status === "Pending").length;
  const approvedCount = myRequests.filter((r) => r.status === "Approved" || r.status === "Assigned").length;
  const completedCount = myRequests.filter((r) => r.status === "Completed").length;

  if (loading) {
    return (
      <div className="patient-dashboard-container">
        <div className="loading-spinner">
          <p>🩸 Loading Patient Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dashboard-container">
      {/* Header Bar */}
      <header className="patient-header">
        <div className="header-brand">
          <h1>🩸 Patient Care Portal</h1>
          <p>
            Welcome, <strong>{patientUser.full_name || "Patient"}</strong> (Blood Group:{" "}
            <strong>{patientUser.blood_group || "N/A"}</strong>)
          </p>
        </div>

        <div className="header-actions">
          <button className="create-btn-sm" onClick={() => setActiveTab("new-request")}>
            + Request Blood
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="patient-nav-tabs">
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
          📜 My Requests ({myRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "new-request" ? "active" : ""}`}
          onClick={() => setActiveTab("new-request")}
        >
          ➕ Post New Request
        </button>
        <button
          className={`tab-btn ${activeTab === "donors" ? "active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          👥 View Donors
        </button>
      </nav>

      {/* Body Content */}
      <main className="patient-body">
        {alert.message && (
          <div className={`alert-message ${alert.type}`}>
            <span>{alert.message}</span>
            <button
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold", color: "inherit" }}
              onClick={() => setAlert({ message: "", type: "" })}
            >
              ×
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Requests</h3>
                  <div className="stat-value">{myRequests.length}</div>
                </div>
                <div className="stat-icon red">🩸</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Pending / Searching</h3>
                  <div className="stat-value">{pendingCount}</div>
                </div>
                <div className="stat-icon yellow">⏳</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Active / Assigned</h3>
                  <div className="stat-value">{approvedCount}</div>
                </div>
                <div className="stat-icon blue">⚡</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Completed</h3>
                  <div className="stat-value">{completedCount}</div>
                </div>
                <div className="stat-icon green">✓</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Quick Blood Request</h2>
              </div>
              <p>Need urgent blood transfusion for yourself or a relative?</p>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
                Submit a new request instantly to notify matching registered donors and hospital administrators.
              </p>
              <button
                className="submit-btn"
                onClick={() => setActiveTab("new-request")}
                style={{ marginTop: "14px", width: "auto" }}
              >
                Post Emergency Request Now →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MY REQUESTS */}
        {activeTab === "requests" && (
          <div className="section-card">
            <div className="section-header">
              <h2>My Submitted Blood Requests</h2>
              <button
                className="submit-btn"
                onClick={() => setActiveTab("new-request")}
                style={{ width: "auto", padding: "8px 16px" }}
              >
                + New Request
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="empty-state">
                <span>📄</span>
                <p>You haven't submitted any blood requests yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Blood Group</th>
                      <th>Hospital / Address</th>
                      <th>Quantity</th>
                      <th>Urgency</th>
                      <th>Date Posted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.map((req) => (
                      <tr key={req.id}>
                        <td>#{req.id}</td>
                        <td><strong>{req.blood_group}</strong></td>
                        <td>{req.hospital}</td>
                        <td>{req.quantity} Bag(s)</td>
                        <td>
                          <span className={`urgency-badge ${req.urgency ? req.urgency.toLowerCase() : "normal"}`}>
                            {req.urgency || "Normal"}
                          </span>
                        </td>
                        <td>{req.created_at || "Recent"}</td>
                        <td>
                          <span className={`status-tag ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POST NEW REQUEST */}
        {activeTab === "new-request" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Post Emergency Blood Request</h2>
            </div>

            <form onSubmit={handleCreateRequest} className="request-form">
              <div className="form-group">
                <label>Patient Name</label>
                <input
                  type="text"
                  value={newRequest.patient_name}
                  onChange={(e) => setNewRequest({ ...newRequest, patient_name: e.target.value })}
                  placeholder="Enter full name of patient"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input
                  type="text"
                  value={newRequest.contact_number}
                  onChange={(e) => setNewRequest({ ...newRequest, contact_number: e.target.value })}
                  placeholder="Phone number for donors to reach out"
                  required
                />
              </div>

              <div className="form-group">
                <label>Blood Group Required</label>
                <select
                  value={newRequest.blood_group}
                  onChange={(e) => setNewRequest({ ...newRequest, blood_group: e.target.value })}
                  required
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
                <label>Hospital Name & Address</label>
                <input
                  type="text"
                  value={newRequest.hospital}
                  onChange={(e) => setNewRequest({ ...newRequest, hospital: e.target.value })}
                  placeholder="e.g. City Central Hospital, Ward 4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity (Bags)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Urgency Level</label>
                <select
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent (Within 24 Hours)</option>
                  <option value="Critical">Critical Emergency (Immediate)</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting Request..." : "Submit Blood Request"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: VIEW DONORS */}
        {activeTab === "donors" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Registered Blood Donors</h2>
              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
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

            {donorsList.length === 0 ? (
              <div className="empty-state">
                <span>👥</span>
                <p>No registered donors found for the selected filter.</p>
              </div>
            ) : (
              <div className="donors-grid">
                {donorsList.map((donor) => (
                  <div key={donor.id} className="donor-card">
                    <div className="card-top">
                      <span className="blood-group-badge">{donor.blood_group || "N/A"}</span>
                      <span className={`availability-tag ${donor.is_available ? "available" : "unavailable"}`}>
                        {donor.is_available ? "● Available" : "○ Busy"}
                      </span>
                    </div>

                    <div className="card-details">
                      <h3>{donor.full_name}</h3>
                      <p><strong>Phone:</strong> {donor.phone || "N/A"}</p>
                      <p><strong>Gender:</strong> {donor.gender || "N/A"}</p>
                      <p><strong>Address:</strong> {donor.address || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientDashboard;
