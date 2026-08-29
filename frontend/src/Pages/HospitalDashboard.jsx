import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { createRealtimeConnection } from "../services/websocket";
import "./HospitalDashboard.css";

function HospitalDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, my-requests, patient-queue, hospitals, donors, profile

  // User/Hospital State
  const [hospitalUser, setHospitalUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [stats, setStats] = useState({
    my_requests_count: 0,
    pending_requests: 0,
    active_requests: 0,
    completed_requests: 0,
    total_system_requests: 0,
    available_donors_count: 0,
  });

  const [myRequests, setMyRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [hospitalsList, setHospitalsList] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalBloodFilter, setHospitalBloodFilter] = useState("");
  const [donorsList, setDonorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [donorBloodFilter, setDonorBloodFilter] = useState("");
  const [queueBloodFilter, setQueueBloodFilter] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState("");

  // New Hospital Request Form State
  const [newRequest, setNewRequest] = useState({
    patient_name: "",
    contact_number: hospitalUser.phone || "",
    blood_group: "O+",
    hospital: hospitalUser.full_name || "",
    quantity: 1,
    urgency: "Urgent",
  });
  const [submitting, setSubmitting] = useState(false);

  // Hospital Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    blood_group: "",
    address: "",
    is_available: true,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "my-requests") {
      fetchMyRequests();
    } else if (activeTab === "patient-queue") {
      fetchAllRequests();
    } else if (activeTab === "hospitals") {
      fetchHospitalsNetwork();
    } else if (activeTab === "donors") {
      fetchDonors();
    } else if (activeTab === "profile") {
      fetchProfile();
    }
  }, [activeTab, donorBloodFilter, queueBloodFilter, queueStatusFilter, hospitalSearch, hospitalBloodFilter]);

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
        fetchInitialData();
        if (activeTab === "my-requests") fetchMyRequests();
        if (activeTab === "patient-queue") fetchAllRequests();
        if (activeTab === "hospitals") fetchHospitalsNetwork();
        if (activeTab === "donors") fetchDonors();
      }
    });
    return cleanup;
  }, [activeTab, donorBloodFilter, queueBloodFilter, queueStatusFilter, hospitalSearch, hospitalBloodFilter]);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [statsRes, myReqsRes] = await Promise.all([
        api.get("/hospital/dashboard").catch(() => null),
        api.get("/hospital/my-requests").catch(() => null),
      ]);

      if (statsRes) {
        setStats({
          my_requests_count: statsRes.data.my_requests_count || 0,
          pending_requests: statsRes.data.pending_requests || 0,
          active_requests: statsRes.data.active_requests || 0,
          completed_requests: statsRes.data.completed_requests || 0,
          total_system_requests: statsRes.data.total_system_requests || 0,
          available_donors_count: statsRes.data.available_donors_count || 0,
        });

        if (statsRes.data.full_name) {
          setHospitalUser((prev) => ({
            ...prev,
            full_name: statsRes.data.full_name,
            phone: statsRes.data.phone,
            address: statsRes.data.address,
            blood_group: statsRes.data.blood_group,
          }));

          setNewRequest((prev) => ({
            ...prev,
            hospital: statsRes.data.full_name,
            contact_number: statsRes.data.phone,
          }));
        }
      }

      if (myReqsRes) {
        setMyRequests(myReqsRes.data);
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
      const res = await api.get("/hospital/my-requests");
      setMyRequests(res.data);
    } catch (err) {
      showAlert("Failed to load hospital requests.", "error");
    }
  };

  const fetchAllRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (queueStatusFilter) params.append("status_filter", queueStatusFilter);
      if (queueBloodFilter) params.append("blood_group", queueBloodFilter);

      const url = `/hospital/all-requests?${params.toString()}`;
      const res = await api.get(url);
      setAllRequests(res.data);
    } catch (err) {
      showAlert("Failed to load emergency requests queue.", "error");
    }
  };

  const fetchHospitalsNetwork = async () => {
    try {
      const params = new URLSearchParams();
      if (hospitalSearch) params.append("search", hospitalSearch);
      if (hospitalBloodFilter) params.append("blood_group", hospitalBloodFilter);

      const url = `/hospital/hospitals?${params.toString()}`;
      const res = await api.get(url);
      setHospitalsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch hospitals network list.", "error");
    }
  };

  const fetchDonors = async () => {
    try {
      const url = donorBloodFilter
        ? `/hospital/donors?blood_group=${encodeURIComponent(donorBloodFilter)}`
        : "/hospital/donors";
      const res = await api.get(url);
      setDonorsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch available donors.", "error");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/hospital/profile");
      setProfileForm({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        blood_group: res.data.blood_group || "O+",
        address: res.data.address || "",
        is_available: res.data.is_available !== false,
      });
    } catch (err) {
      showAlert("Failed to load hospital profile.", "error");
    }
  };

  const handleCreateHospitalRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...newRequest,
        patient_name: newRequest.patient_name || `${hospitalUser.full_name || "Hospital"} Emergency Ward`,
      };

      const res = await api.post("/hospital/requests", payload);
      showAlert(res.data.message || "Hospital blood request posted successfully!");
      setNewRequest({
        patient_name: "",
        contact_number: hospitalUser.phone || "",
        blood_group: "O+",
        hospital: hospitalUser.full_name || "",
        quantity: 1,
        urgency: "Urgent",
      });
      fetchMyRequests();
      fetchInitialData();
      setActiveTab("my-requests");
    } catch (err) {
      showAlert(
        err.response?.data?.detail || "Failed to submit hospital blood request.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      await api.put(`/hospital/requests/${requestId}`, { status: newStatus });
      showAlert(`Blood request #${requestId} updated to ${newStatus}`);
      fetchMyRequests();
      fetchAllRequests();
      fetchInitialData();
    } catch (err) {
      showAlert("Failed to update request status.", "error");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm(`Delete blood request #${requestId}?`)) return;
    try {
      await api.delete(`/hospital/requests/${requestId}`);
      showAlert("Request deleted.");
      fetchMyRequests();
      fetchAllRequests();
      fetchInitialData();
    } catch (err) {
      showAlert("Failed to delete request.", "error");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put("/hospital/profile", profileForm);
      showAlert("Hospital profile updated successfully!");
      if (res.data.user) {
        const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updated = { ...existingUser, ...res.data.user };
        localStorage.setItem("user", JSON.stringify(updated));
        setHospitalUser(updated);
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
      <div className="hospital-dashboard-container">
        <div className="loading-spinner">
          <p>🏥 Loading Hospital Management Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-dashboard-container">
      {/* Header Bar */}
      <header className="hospital-header">
        <div className="header-brand">
          <h1>🏥 Hospital Care & Transfusion Portal</h1>
          <p>
            Connected Facility: <strong>{hospitalUser.full_name || "Hospital Center"}</strong> (Hotline:{" "}
            <strong>{hospitalUser.phone || "N/A"}</strong>)
          </p>
        </div>

        <div className="header-actions">
          <span className="stock-status-badge">
            ● Active Blood Bank & Emergency Ward
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="hospital-nav-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "my-requests" ? "active" : ""}`}
          onClick={() => setActiveTab("my-requests")}
        >
          🏥 Hospital Requests ({myRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "patient-queue" ? "active" : ""}`}
          onClick={() => setActiveTab("patient-queue")}
        >
          📋 Emergency Requests Queue
        </button>
        <button
          className={`tab-btn ${activeTab === "hospitals" ? "active" : ""}`}
          onClick={() => setActiveTab("hospitals")}
        >
          🏥 Hospital Network
        </button>
        <button
          className={`tab-btn ${activeTab === "donors" ? "active" : ""}`}
          onClick={() => setActiveTab("donors")}
        >
          👥 Donor Network
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          👤 Hospital Profile
        </button>
      </nav>

      {/* Main Content Body */}
      <main className="hospital-body">
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
                  <h3>Hospital Requests</h3>
                  <div className="stat-value">{stats.my_requests_count}</div>
                </div>
                <div className="stat-icon red">🏥</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Pending Transfusions</h3>
                  <div className="stat-value">{stats.pending_requests}</div>
                </div>
                <div className="stat-icon yellow">⏳</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Assigned / In Progress</h3>
                  <div className="stat-value">{stats.active_requests}</div>
                </div>
                <div className="stat-icon blue">⚡</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Fulfilled Transfusions</h3>
                  <div className="stat-value">{stats.completed_requests}</div>
                </div>
                <div className="stat-icon green">✓</div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <h3>Network Donors</h3>
                  <div className="stat-value">{stats.available_donors_count}</div>
                </div>
                <div className="stat-icon purple">👥</div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Hospital Transfusion Management Quick Actions</h2>
              </div>
              <p style={{ color: "#c7d2fe", fontSize: "15px", lineHeight: "1.6" }}>
                As a registered hospital user, you can issue high-priority blood requests for emergency wards, respond to patient blood requests, coordinate with other hospitals in the network, and connect with blood donors directly.
              </p>
              <div style={{ marginTop: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <button
                  className="submit-btn"
                  onClick={() => setActiveTab("my-requests")}
                >
                  + Post Hospital Emergency Request
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setActiveTab("patient-queue")}
                >
                  Inspect Emergency Requests Queue →
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setActiveTab("hospitals")}
                >
                  View Hospital Network Directory
                </button>

                <button
                  className="secondary-btn"
                  onClick={() => setActiveTab("donors")}
                >
                  Find Available Donors
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOSPITAL OWN REQUESTS */}
        {activeTab === "my-requests" && (
          <div>
            <div className="section-card">
              <div className="section-header">
                <h2>Post New Hospital Blood Request</h2>
              </div>

              <form onSubmit={handleCreateHospitalRequest} className="request-form">
                <div className="form-group">
                  <label>Patient / Unit Description</label>
                  <input
                    type="text"
                    value={newRequest.patient_name}
                    onChange={(e) => setNewRequest({ ...newRequest, patient_name: e.target.value })}
                    placeholder="e.g. ICU Ward 3, Trauma Unit Emergency"
                  />
                </div>

                <div className="form-group">
                  <label>Emergency Hotline / Contact Number</label>
                  <input
                    type="text"
                    value={newRequest.contact_number}
                    onChange={(e) => setNewRequest({ ...newRequest, contact_number: e.target.value })}
                    placeholder="Hospital emergency helpline"
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
                  <label>Hospital & Department Address</label>
                  <input
                    type="text"
                    value={newRequest.hospital}
                    onChange={(e) => setNewRequest({ ...newRequest, hospital: e.target.value })}
                    placeholder="Hospital name and specific building/ward"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Quantity Required (Bags)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
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
                    <option value="Urgent">Urgent (Within 12 Hours)</option>
                    <option value="Critical">Critical Emergency (Immediate)</option>
                  </select>
                </div>

                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? "Posting Request..." : "Post Hospital Request Now"}
                </button>
              </form>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Hospital Issued Requests</h2>
              </div>

              {myRequests.length === 0 ? (
                <div className="empty-state">
                  <span>📄</span>
                  <p>No hospital blood requests posted yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Patient / Ward</th>
                        <th>Blood Group</th>
                        <th>Quantity</th>
                        <th>Urgency</th>
                        <th>Volunteers</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((req) => (
                        <tr key={req.id}>
                          <td>#{req.id}</td>
                          <td><strong>{req.patient_name}</strong></td>
                          <td><span className="blood-group-badge-sm">{req.blood_group}</span></td>
                          <td>{req.quantity} Bag(s)</td>
                          <td>
                            <span className={`urgency-badge ${req.urgency.toLowerCase()}`}>
                              {req.urgency}
                            </span>
                          </td>
                          <td>
                            <span className="volunteers-count-pill">
                              🤝 {req.volunteers_count} Volunteer(s)
                            </span>
                          </td>
                          <td>
                            <span className={`status-tag ${req.status.toLowerCase()}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.status !== "Completed" && (
                              <button
                                className="action-btn-sm complete"
                                onClick={() => handleUpdateRequestStatus(req.id, "Completed")}
                              >
                                Mark Fulfilled
                              </button>
                            )}
                            <button
                              className="action-btn-sm delete"
                              onClick={() => handleDeleteRequest(req.id)}
                            >
                              Delete
                            </button>
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

        {/* TAB 3: PATIENT REQUESTS QUEUE */}
        {activeTab === "patient-queue" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Emergency System Blood Requests Queue</h2>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
                </select>

                <select
                  value={queueBloodFilter}
                  onChange={(e) => setQueueBloodFilter(e.target.value)}
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
            </div>

            {allRequests.length === 0 ? (
              <div className="empty-state">
                <span>📋</span>
                <p>No system requests match the selected filters.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient Name</th>
                      <th>Blood Group</th>
                      <th>Hospital / Address</th>
                      <th>Quantity</th>
                      <th>Urgency</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Hospital Action Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRequests.map((req) => (
                      <tr key={req.id}>
                        <td>#{req.id}</td>
                        <td><strong>{req.patient_name}</strong></td>
                        <td><span className="blood-group-badge-sm">{req.blood_group}</span></td>
                        <td>{req.hospital}</td>
                        <td>{req.quantity} Bag(s)</td>
                        <td>
                          <span className={`urgency-badge ${req.urgency.toLowerCase()}`}>
                            {req.urgency}
                          </span>
                        </td>
                        <td>{req.contact_number}</td>
                        <td>
                          <span className={`status-tag ${req.status.toLowerCase()}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === "Pending" && (
                            <button
                              className="action-btn-sm complete"
                              onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                              style={{ background: "#2563eb" }}
                            >
                              Accept & Approve
                            </button>
                          )}
                          {req.status !== "Completed" && (
                            <button
                              className="action-btn-sm complete"
                              onClick={() => handleUpdateRequestStatus(req.id, "Completed")}
                            >
                              Fulfill Blood
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HOSPITALS NETWORK LIST */}
        {activeTab === "hospitals" && (
          <div className="section-card">
            <div className="section-header">
              <h2>🏥 Partner Hospitals & Medical Center Directory</h2>
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
                <p>No medical centers found matching your search filter.</p>
              </div>
            ) : (
              <div className="hospitals-grid">
                {hospitalsList.map((hosp) => (
                  <div key={hosp.id} className="hospital-card">
                    <div className="hosp-card-top">
                      <div className="hosp-card-header-block" style={{ width: "100%" }}>
                        <h3>🏥 {hosp.name}</h3>
                        <div className="hosp-meta-row" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                          <span className="hosp-city-badge" style={{ color: "#a5b4fc", fontSize: "13px", fontWeight: "600" }}>
                            📍 {hosp.city}
                          </span>
                          <span className="emergency-service-pill" style={{ background: "rgba(234, 179, 8, 0.2)", color: "#fde047", padding: "4px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                            ⚡ {hosp.emergency_services}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hosp-details">
                      <p><strong>Address:</strong> {hosp.address}</p>
                      <p><strong>Hotline:</strong> {hosp.phone}</p>
                      <p><strong>Blood Bank Status:</strong> <span style={{ color: "#4ade80", fontWeight: "700" }}>{hosp.blood_bank_status}</span></p>

                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ fontSize: "12px", color: "#a5b4fc", display: "block", marginBottom: "6px" }}>Stocked Blood Groups:</strong>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {hosp.available_groups && hosp.available_groups.map((group) => (
                            <span key={group} style={{ background: "rgba(244, 63, 94, 0.2)", color: "#fda4af", border: "1px solid rgba(244, 63, 94, 0.4)", fontSize: "11px", padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>
                              🩸 {group}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Active Hospital Needs Section */}
                      {hosp.active_requests && hosp.active_requests.length > 0 ? (
                        <div style={{ marginTop: "14px", background: "rgba(15, 12, 41, 0.7)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "12px", padding: "12px" }}>
                          <strong style={{ fontSize: "13px", color: "#f43f5e", display: "flex", alignItems: "center", gap: "6px" }}>
                            ⚡ Active Emergency Blood Needs ({hosp.active_requests.length})
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
                                  onClick={() => {
                                    if (req.id.toString().startsWith("sample-")) {
                                      showAlert(`Responded to ${hosp.name}'s request for ${req.blood_group}! Transfusion team notified.`);
                                    } else {
                                      handleUpdateRequestStatus(req.id, "Approved");
                                    }
                                  }}
                                >
                                  Fulfill Need
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: "12px", fontSize: "12px", color: "#4ade80" }}>
                          ✓ No critical blood shortage reported currently
                        </div>
                      )}
                    </div>

                    {hosp.phone && (
                      <a href={`tel:${hosp.phone}`} className="contact-donor-btn">
                        📞 Contact Hospital Hotline
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DONOR NETWORK */}
        {activeTab === "donors" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Hospital Registered Donor Network</h2>
              <select
                value={donorBloodFilter}
                onChange={(e) => setDonorBloodFilter(e.target.value)}
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
                <p>No registered blood donors found.</p>
              </div>
            ) : (
              <div className="donors-grid">
                {donorsList.map((donor) => (
                  <div key={donor.id} className="donor-card">
                    <div className="card-top">
                      <span className="blood-group-badge-sm">{donor.blood_group || "N/A"}</span>
                      <span className={`availability-tag ${donor.is_available ? "available" : "unavailable"}`}>
                        {donor.is_available ? "● Ready to Donate" : "○ Unavailable"}
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
                        📞 Contact Donor for Drive
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: HOSPITAL PROFILE */}
        {activeTab === "profile" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Hospital Profile & Medical Center Information</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Hospital / Medical Center Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Hotline</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Main Stocked Blood Group</label>
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

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Hospital City & Full Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                Save Hospital Profile
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default HospitalDashboard;
