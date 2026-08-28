import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PatientDashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, requests, new-request, donors, hospitals, profile

  // Dashboard & User state
  const [patientUser, setPatientUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [stats, setStats] = useState({
    total_requests: 0,
    pending_requests: 0,
    active_requests: 0,
    completed_requests: 0,
    available_donors_count: 0,
  });

  const [myRequests, setMyRequests] = useState([]);
  const [donorsList, setDonorsList] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalBloodFilter, setHospitalBloodFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [bloodFilter, setBloodFilter] = useState("");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    blood_group: "",
    gender: "Male",
    address: "",
  });

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
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchMyRequests();
    } else if (activeTab === "donors") {
      fetchDonors();
    } else if (activeTab === "hospitals") {
      fetchHospitals();
    } else if (activeTab === "profile") {
      fetchProfile();
    }
  }, [activeTab, bloodFilter, hospitalSearch, hospitalBloodFilter]);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqsRes] = await Promise.all([
        api.get("/patient/dashboard").catch(() => null),
        api.get("/patient/requests").catch(() => null),
      ]);

      if (statsRes) {
        setStats({
          total_requests: statsRes.data.total_requests || 0,
          pending_requests: statsRes.data.pending_requests || 0,
          active_requests: statsRes.data.active_requests || 0,
          completed_requests: statsRes.data.completed_requests || 0,
          available_donors_count: statsRes.data.available_donors_count || 0,
        });

        if (statsRes.data.full_name) {
          setPatientUser((prev) => ({
            ...prev,
            full_name: statsRes.data.full_name,
            blood_group: statsRes.data.blood_group,
            phone: statsRes.data.phone,
            address: statsRes.data.address,
          }));
        }
      }

      if (reqsRes) {
        setMyRequests(reqsRes.data);
      }
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
        ? `/patient/donors?blood_group=${encodeURIComponent(bloodFilter)}`
        : "/patient/donors";
      const res = await api.get(url);
      setDonorsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch available donors.", "error");
    }
  };

  const fetchHospitals = async () => {
    try {
      const params = new URLSearchParams();
      if (hospitalSearch) params.append("search", hospitalSearch);
      if (hospitalBloodFilter) params.append("blood_group", hospitalBloodFilter);

      const url = `/patient/hospitals?${params.toString()}`;
      const res = await api.get(url);
      setHospitalsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch partner hospitals.", "error");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/patient/profile");
      setProfileForm({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        blood_group: res.data.blood_group || "O+",
        gender: res.data.gender || "Male",
        address: res.data.address || "",
      });
    } catch (err) {
      showAlert("Failed to load profile details.", "error");
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
      fetchInitialData();
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

  const handleSelectHospitalForRequest = (hospital) => {
    setNewRequest((prev) => ({
      ...prev,
      hospital: `${hospital.name}, ${hospital.address}`,
    }));
    setActiveTab("new-request");
    showAlert(`Selected ${hospital.name} for blood request form.`);
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await api.put(`/patient/requests/${requestId}`, { status: newStatus });
      showAlert(`Request status updated to ${newStatus}`);
      fetchMyRequests();
      fetchInitialData();
    } catch (err) {
      showAlert("Failed to update request status.", "error");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel and delete this blood request?")) {
      return;
    }
    try {
      await api.delete(`/patient/requests/${requestId}`);
      showAlert("Blood request deleted successfully.");
      fetchMyRequests();
      fetchInitialData();
    } catch (err) {
      showAlert("Failed to delete blood request.", "error");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/patient/profile", profileForm);
      showAlert("Profile updated successfully!");
      if (res.data.user) {
        const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updated = { ...existingUser, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(updated));
        setPatientUser(updated);
      }
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
            Welcome back, <strong>{patientUser.full_name || "Patient"}</strong> (Blood Group:{" "}
            <strong>{patientUser.blood_group || "Unspecified"}</strong>)
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
          className={`tab-btn ${activeTab === "hospitals" ? "active" : ""}`}
          onClick={() => setActiveTab("hospitals")}
        >
          🏥 Hospital Directory
        </button>
        <button
          className={`tab-btn ${activeTab === "donors" ? "active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          👥 View Donors
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 My Profile
        </button>
      </nav>

      {/* Main Body Content */}
      <main className="patient-body">
        {alert.message && (
          <div className={`alert-message ${alert.type}`}>
            <span>{alert.message}</span>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                color: "inherit",
              }}
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
                  <div className="stat-value">{stats.total_requests || myRequests.length}</div>
                </div>
                <div className="stat-icon red">🩸</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Pending / Searching</h3>
                  <div className="stat-value">
                    {stats.pending_requests || myRequests.filter((r) => r.status === "Pending").length}
                  </div>
                </div>
                <div className="stat-icon yellow">⏳</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Active / Assigned</h3>
                  <div className="stat-value">
                    {stats.active_requests || myRequests.filter((r) => r.status === "Approved" || r.status === "Assigned").length}
                  </div>
                </div>
                <div className="stat-icon blue">⚡</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Completed</h3>
                  <div className="stat-value">
                    {stats.completed_requests || myRequests.filter((r) => r.status === "Completed").length}
                  </div>
                </div>
                <div className="stat-icon green">✓</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Available Donors</h3>
                  <div className="stat-value">{stats.available_donors_count || "Active"}</div>
                </div>
                <div className="stat-icon purple">👥</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Emergency Blood Transfusion Needs?</h2>
              </div>
              <p style={{ color: "#c7d2fe", fontSize: "15px", lineHeight: "1.6" }}>
                Submit a high-priority blood request instantly. Registered blood donors matching your requested blood group will be notified, and hospital administrators can assign volunteers right away.
              </p>
              <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button
                  className="submit-btn"
                  onClick={() => setActiveTab("new-request")}
                >
                  Post Emergency Blood Request →
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setActiveTab("hospitals")}
                >
                  Browse Partner Hospitals Directory
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setActiveTab("donors")}
                >
                  Browse Available Donors
                </button>
              </div>
            </div>

            {/* Recent Requests Preview */}
            <div className="section-card">
              <div className="section-header">
                <h2>Recent Submitted Requests</h2>
                {myRequests.length > 0 && (
                  <button
                    className="secondary-btn-sm"
                    onClick={() => setActiveTab("requests")}
                  >
                    View All ({myRequests.length})
                  </button>
                )}
              </div>

              {myRequests.length === 0 ? (
                <div className="empty-state">
                  <span>📄</span>
                  <p>No blood requests submitted yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Blood Group</th>
                        <th>Hospital</th>
                        <th>Quantity</th>
                        <th>Urgency</th>
                        <th>Volunteers</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.slice(0, 5).map((req) => (
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
                          <td>
                            <span className="volunteers-count-pill">
                              🤝 {req.volunteers_count || (req.volunteers ? req.volunteers.length : 0)} Volunteer(s)
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${req.status ? req.status.toLowerCase() : "pending"}`}>
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
          </div>
        )}

        {/* TAB 2: MY REQUESTS */}
        {activeTab === "requests" && (
          <div className="section-card">
            <div className="section-header">
              <h2>My Blood Requests & Volunteer Donors</h2>
              <button
                className="submit-btn"
                onClick={() => setActiveTab("new-request")}
                style={{ margin: 0, padding: "10px 20px" }}
              >
                + New Blood Request
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="empty-state">
                <span>📄</span>
                <p>You haven't submitted any blood requests yet.</p>
              </div>
            ) : (
              <div className="requests-vertical-list">
                {myRequests.map((req) => (
                  <div key={req.id} className="patient-request-card">
                    <div className="request-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span className="blood-group-badge">{req.blood_group}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
                            Request #{req.id} — {req.hospital}
                          </h3>
                          <span style={{ fontSize: "13px", color: "#a5b4fc" }}>
                            Posted for {req.patient_name || patientUser.full_name || "Patient"} ({req.quantity} Bag(s)) • {req.created_at || "Recent"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className={`urgency-badge ${req.urgency ? req.urgency.toLowerCase() : "normal"}`}>
                          {req.urgency || "Normal"}
                        </span>
                        <span className={`status-tag ${req.status ? req.status.toLowerCase() : "pending"}`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div className="request-card-body">
                      <p><strong>Contact Phone:</strong> {req.contact_number || "N/A"}</p>
                      <p><strong>Hospital / Location:</strong> {req.hospital}</p>
                      <p><strong>Quantity Needed:</strong> {req.quantity} Unit Bag(s)</p>
                    </div>

                    {/* Volunteer Donors Section */}
                    {req.volunteers && req.volunteers.length > 0 ? (
                      <div className="volunteers-box">
                        <h4>🤝 Volunteer Donors Signed Up ({req.volunteers.length})</h4>
                        <div className="volunteers-grid">
                          {req.volunteers.map((vol) => (
                            <div key={vol.donation_id || vol.donor_id} className="volunteer-card">
                              <div>
                                <strong>{vol.donor_name}</strong>
                                <span className="vol-blood-tag">{vol.donor_blood_group}</span>
                              </div>
                              <p style={{ margin: "4px 0", fontSize: "13px", color: "#c7d2fe" }}>
                                📞 <strong>Phone:</strong> {vol.donor_phone}
                              </p>
                              {vol.donor_address && (
                                <p style={{ margin: "2px 0", fontSize: "12px", color: "#a5b4fc" }}>
                                  📍 {vol.donor_address}
                                </p>
                              )}
                              <span className={`status-tag ${vol.status ? vol.status.toLowerCase() : "pending"}`} style={{ marginTop: "6px" }}>
                                {vol.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-volunteers-hint">
                        <span>⏳ Searching for matching donors... No volunteer responded yet.</span>
                      </div>
                    )}

                    <div className="request-card-actions">
                      {req.status !== "Completed" && (
                        <button
                          className="action-btn-sm complete"
                          onClick={() => handleUpdateRequestStatus(req.id, "Completed")}
                        >
                          ✓ Mark Request Completed
                        </button>
                      )}

                      {req.status === "Pending" && (
                        <button
                          className="action-btn-sm cancel"
                          onClick={() => handleUpdateRequestStatus(req.id, "Cancelled")}
                        >
                          Pause Request
                        </button>
                      )}

                      <button
                        className="action-btn-sm delete"
                        onClick={() => handleDeleteRequest(req.id)}
                      >
                        Delete Request
                      </button>
                    </div>
                  </div>
                ))}
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
                <label>Patient Full Name</label>
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
                  placeholder="Phone number for volunteer donors to reach out"
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
                <label>Hospital Name & Full Address</label>
                <input
                  type="text"
                  value={newRequest.hospital}
                  onChange={(e) => setNewRequest({ ...newRequest, hospital: e.target.value })}
                  placeholder="e.g. City General Hospital, ICU Ward, Room 204"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity (Bags / Units)</label>
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
                  <option value="Normal">Normal (Routine Transfusion)</option>
                  <option value="Urgent">Urgent (Within 24 Hours)</option>
                  <option value="Critical">Critical Emergency (Immediate Needs)</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Submitting Blood Request..." : "Submit Blood Request Now"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: HOSPITALS DIRECTORY */}
        {activeTab === "hospitals" && (
          <div className="section-card">
            <div className="section-header">
              <h2>🏥 Partner Hospitals & Blood Bank Directory</h2>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Search hospital or city..."
                  value={hospitalSearch}
                  onChange={(e) => setHospitalSearch(e.target.value)}
                  className="filter-select"
                  style={{ width: "220px" }}
                />

                <select
                  value={hospitalBloodFilter}
                  onChange={(e) => setHospitalBloodFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Blood Stock</option>
                  <option value="A+">A+ Stock</option>
                  <option value="A-">A- Stock</option>
                  <option value="B+">B+ Stock</option>
                  <option value="B-">B- Stock</option>
                  <option value="AB+">AB+ Stock</option>
                  <option value="AB-">AB- Stock</option>
                  <option value="O+">O+ Stock</option>
                  <option value="O-">O- Stock</option>
                </select>
              </div>
            </div>

            {hospitalsList.length === 0 ? (
              <div className="empty-state">
                <span>🏥</span>
                <p>No hospitals found matching your search filter.</p>
              </div>
            ) : (
              <div className="hospitals-grid">
                {hospitalsList.map((hosp) => (
                  <div key={hosp.id} className="hospital-card">
                    <div className="hosp-card-top">
                      <div className="hosp-card-header-block" style={{ width: "100%" }}>
                        <h3>🏥 {hosp.name}</h3>
                        <div className="hosp-meta-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                          <span className="hosp-city-badge">📍 {hosp.city}</span>
                          <span className="emergency-service-pill">
                            ⚡ {hosp.emergency_services}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hosp-details">
                      <p><strong>Address:</strong> {hosp.address}</p>
                      <p><strong>Emergency Hotline:</strong> {hosp.phone}</p>
                      <p><strong>Blood Bank Status:</strong> <span className="status-highlight">{hosp.blood_bank_status}</span></p>

                      <div className="available-stocks-section">
                        <strong>Stocked Blood Groups:</strong>
                        <div className="stock-tags-wrapper">
                          {hosp.available_groups.map((group) => (
                            <span key={group} className="stock-tag">
                              🩸 {group}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Active Hospital Needs Section */}
                      {hosp.active_requests && hosp.active_requests.length > 0 ? (
                        <div style={{ marginTop: "14px", background: "rgba(15, 12, 41, 0.7)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "12px", padding: "12px" }}>
                          <strong style={{ fontSize: "13px", color: "#f43f5e", display: "flex", alignItems: "center", gap: "6px" }}>
                            ⚡ Urgent Blood Needs at this Hospital ({hosp.active_requests.length})
                          </strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                            {hosp.active_requests.map((req) => (
                              <div key={req.id} style={{ background: "rgba(23, 19, 60, 0.8)", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <span style={{ fontWeight: "800", color: "#f43f5e", fontSize: "13px" }}>{req.blood_group}</span>
                                  <span style={{ fontSize: "12px", color: "#c7d2fe", marginLeft: "8px" }}>({req.quantity} Bag{req.quantity > 1 ? "s" : ""}) • {req.urgency}</span>
                                  <div style={{ fontSize: "11px", color: "#a5b4fc" }}>{req.patient_name}</div>
                                </div>
                                <button
                                  className="action-btn-sm complete"
                                  style={{ fontSize: "11px", padding: "4px 10px", margin: 0 }}
                                  onClick={() => handleSelectHospitalForRequest(hosp)}
                                >
                                  Request Blood
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: "12px", fontSize: "12px", color: "#4ade80" }}>
                          ✓ Blood stock healthy & operational
                        </div>
                      )}
                    </div>

                    <div className="hosp-card-actions">
                      <a href={`tel:${hosp.phone}`} className="contact-donor-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                        📞 Call Hotline
                      </a>
                      <button
                        className="select-hosp-btn"
                        onClick={() => handleSelectHospitalForRequest(hosp)}
                      >
                        + Request Blood Here
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VIEW DONORS */}
        {activeTab === "donors" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Registered Blood Donors Directory</h2>
              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                className="filter-select"
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
                <p>No registered blood donors found matching your filter criteria.</p>
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

                    {donor.phone && (
                      <a href={`tel:${donor.phone}`} className="contact-donor-btn">
                        📞 Call Donor Directly
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: MY PROFILE */}
        {activeTab === "profile" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Patient Profile & Account Settings</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={profileForm.blood_group}
                  onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
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
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Address / Residential Location</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Enter your home address or current city"
                  required
                />
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

export default PatientDashboard;
