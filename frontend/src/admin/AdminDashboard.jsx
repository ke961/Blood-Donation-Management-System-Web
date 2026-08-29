import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { createRealtimeConnection } from "../services/websocket";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, requests, donations

  // Dashboard Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_donors: 0,
    total_patients: 0,
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    assigned_requests: 0,
    completed_requests: 0,
    total_donations: 0,
    completed_donations: 0,
  });

  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [donationsList, setDonationsList] = useState([]);

  // Filters & UI
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ message: "", type: "" });

  // Modal for creating blood request
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    patient_name: "",
    contact_number: "",
    blood_group: "O+",
    hospital: "",
    quantity: 1,
    urgency: "Normal",
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    else if (activeTab === "requests") loadRequests();
    else if (activeTab === "donations") loadDonations();
  }, [activeTab, roleFilter, statusFilter]);

  // Real-time WebSocket listener
  useEffect(() => {
    const cleanup = createRealtimeConnection((message) => {
      // Refresh everything on any database change since admin sees all data
      loadDashboardStats();
      if (activeTab === "users") loadUsers();
      if (activeTab === "requests") loadRequests();
      if (activeTab === "donations") loadDonations();
    });
    return cleanup;
  }, [activeTab, roleFilter, statusFilter]);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 4000);
  };

  const loadDashboardStats = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        navigate("/login");
      } else {
        showAlert("Failed to load dashboard statistics.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const url = roleFilter ? `/admin/users?role=${roleFilter}` : "/admin/users";
      const res = await api.get(url);
      setUsersList(res.data);
    } catch (err) {
      showAlert("Failed to fetch users list.", "error");
    }
  };

  const loadRequests = async () => {
    try {
      const url = statusFilter
        ? `/admin/requests?status_filter=${statusFilter}`
        : "/admin/requests";
      const res = await api.get(url);
      setRequestsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch blood requests.", "error");
    }
  };

  const loadDonations = async () => {
    try {
      const res = await api.get("/admin/donations");
      setDonationsList(res.data);
    } catch (err) {
      showAlert("Failed to fetch donations.", "error");
    }
  };

  // User Actions
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      showAlert(`User role updated to ${newRole}`);
      loadUsers();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to update user role.", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      showAlert("User deleted successfully.");
      loadUsers();
      loadDashboardStats();
    } catch (err) {
      showAlert(err.response?.data?.detail || "Failed to delete user.", "error");
    }
  };

  // Request Actions
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/requests", newRequestData);
      showAlert("Blood request created successfully!");
      setShowCreateModal(false);
      setNewRequestData({
        patient_name: "",
        contact_number: "",
        blood_group: "O+",
        hospital: "",
        quantity: 1,
        urgency: "Normal",
      });
      loadRequests();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to create blood request.", "error");
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await api.put(`/admin/requests/${requestId}`, { status });
      showAlert(`Request status updated to ${status}`);
      loadRequests();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to update request status.", "error");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm("Delete this blood request?")) return;
    try {
      await api.delete(`/admin/requests/${requestId}`);
      showAlert("Request deleted.");
      loadRequests();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to delete request.", "error");
    }
  };

  // Donation Actions
  const handleUpdateDonationStatus = async (donationId, status) => {
    try {
      await api.put(`/admin/donations/${donationId}`, { status });
      showAlert(`Donation status updated to ${status}`);
      loadDonations();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to update donation status.", "error");
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Delete this donation record?")) return;
    try {
      await api.delete(`/admin/donations/${donationId}`);
      showAlert("Donation record deleted.");
      loadDonations();
      loadDashboardStats();
    } catch (err) {
      showAlert("Failed to delete record.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="admin-dashboard-container" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading Admin Control Center...</h2>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <h1>🛡️ Admin Dashboard</h1>
          <p>Blood Donation Management System</p>
        </div>

        <button className="logout-btn-admin" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Tabs Nav */}
      <nav className="admin-nav-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          🩸 Blood Requests
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "donations" ? "active" : ""}`}
          onClick={() => setActiveTab("donations")}
        >
          🤝 Donation Records
        </button>
      </nav>

      {/* Body */}
      <main className="admin-body">
        {alert.message && (
          <div className={`admin-alert ${alert.type}`}>
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert({ message: "", type: "" })}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Users</h3>
                <strong>{stats.total_users}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Registered Donors</h3>
                <strong>{stats.total_donors}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Registered Patients</h3>
                <strong>{stats.total_patients}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Total Blood Requests</h3>
                <strong>{stats.total_requests}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Pending Requests</h3>
                <strong>{stats.pending_requests}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Approved Requests</h3>
                <strong>{stats.approved_requests}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Assigned Requests</h3>
                <strong>{stats.assigned_requests}</strong>
              </div>
              <div className="admin-stat-card">
                <h3>Completed Donations</h3>
                <strong>{stats.completed_donations}</strong>
              </div>
            </div>

            <div className="admin-section-card">
              <div className="admin-section-header">
                <h2>Quick Actions</h2>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setActiveTab("requests");
                  setShowCreateModal(true);
                }}
              >
                + Post New Blood Request
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h2>Registered Users Directory</h2>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: "8px", borderRadius: "6px", background: "#0f172a", color: "white" }}
              >
                <option value="">All Roles</option>
                <option value="donor">Donors</option>
                <option value="patient">Patients</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                    <th>Availability</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user.id}>
                      <td>#{user.id}</td>
                      <td><strong>{user.full_name}</strong></td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.blood_group || "N/A"}</td>
                      <td>{user.phone || "N/A"}</td>
                      <td>
                        {user.role === "donor" ? (
                          <span style={{ color: user.is_available ? "#4ade80" : "#fca5a5" }}>
                            {user.is_available ? "Available" : "Unavailable"}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="btn-sm edit"
                          style={{ background: "#334155", color: "white", padding: "4px" }}
                        >
                          <option value="donor">Set Donor</option>
                          <option value="patient">Set Patient</option>
                          <option value="admin">Set Admin</option>
                        </select>

                        <button
                          className="btn-sm delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BLOOD REQUESTS */}
        {activeTab === "requests" && (
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h2>All System Blood Requests</h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: "8px", borderRadius: "6px", background: "#0f172a", color: "white" }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  className="btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Create Request
                </button>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Patient Name</th>
                    <th>Blood Group</th>
                    <th>Hospital</th>
                    <th>Quantity</th>
                    <th>Urgency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsList.map((req) => (
                    <tr key={req.id}>
                      <td>#{req.id}</td>
                      <td>{req.patient_name}</td>
                      <td><strong>{req.blood_group}</strong></td>
                      <td>{req.hospital}</td>
                      <td>{req.quantity} Bag(s)</td>
                      <td>{req.urgency}</td>
                      <td>
                        <span className={`badge ${req.status.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === "Pending" && (
                          <button
                            className="btn-sm approve"
                            onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                          >
                            Approve
                          </button>
                        )}
                        {req.status !== "Completed" && (
                          <button
                            className="btn-sm complete"
                            onClick={() => handleUpdateRequestStatus(req.id, "Completed")}
                          >
                            Mark Completed
                          </button>
                        )}
                        <button
                          className="btn-sm delete"
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
          </div>
        )}

        {/* TAB 4: DONATIONS */}
        {activeTab === "donations" && (
          <div className="admin-section-card">
            <div className="admin-section-header">
              <h2>Donation Activity Logs</h2>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Donor Name</th>
                    <th>Donor Contact</th>
                    <th>Request ID</th>
                    <th>Blood Group</th>
                    <th>Hospital</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donationsList.map((d) => (
                    <tr key={d.id}>
                      <td>#{d.id}</td>
                      <td><strong>{d.donor_name}</strong></td>
                      <td>{d.donor_phone}</td>
                      <td>#{d.request_id}</td>
                      <td>{d.blood_group}</td>
                      <td>{d.hospital}</td>
                      <td>{d.donation_date}</td>
                      <td>
                        <span className={`badge ${d.status.toLowerCase()}`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.status !== "Completed" && (
                          <button
                            className="btn-sm complete"
                            onClick={() => handleUpdateDonationStatus(d.id, "Completed")}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          className="btn-sm delete"
                          onClick={() => handleDeleteDonation(d.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create Blood Request */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Post New Blood Request</h3>
              <form onSubmit={handleCreateRequest}>
                <div className="admin-form-group">
                  <label>Patient Name</label>
                  <input
                    type="text"
                    value={newRequestData.patient_name}
                    onChange={(e) =>
                      setNewRequestData({ ...newRequestData, patient_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={newRequestData.contact_number}
                    onChange={(e) =>
                      setNewRequestData({ ...newRequestData, contact_number: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Blood Group Required</label>
                  <select
                    value={newRequestData.blood_group}
                    onChange={(e) =>
                      setNewRequestData({ ...newRequestData, blood_group: e.target.value })
                    }
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

                <div className="admin-form-group">
                  <label>Hospital & Address</label>
                  <input
                    type="text"
                    value={newRequestData.hospital}
                    onChange={(e) =>
                      setNewRequestData({ ...newRequestData, hospital: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Quantity (Bags)</label>
                  <input
                    type="number"
                    min="1"
                    value={newRequestData.quantity}
                    onChange={(e) =>
                      setNewRequestData({
                        ...newRequestData,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Urgency Level</label>
                  <select
                    value={newRequestData.urgency}
                    onChange={(e) =>
                      setNewRequestData({ ...newRequestData, urgency: e.target.value })
                    }
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-sm edit"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;