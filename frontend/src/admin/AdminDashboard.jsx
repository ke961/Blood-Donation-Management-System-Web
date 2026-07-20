import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_users: 0,
    total_donors: 0,
    total_patients: 0,
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    assigned_requests: 0,
    completed_donations: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data);
    } catch (err) {
      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Blood Donation Management System</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Total Users</h3>
          <strong>{stats.total_users}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Total Donors</h3>
          <strong>{stats.total_donors}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Total Patients</h3>
          <strong>{stats.total_patients}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Total Requests</h3>
          <strong>{stats.total_requests}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Pending Requests</h3>
          <strong>{stats.pending_requests}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Approved Requests</h3>
          <strong>{stats.approved_requests}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Assigned Requests</h3>
          <strong>{stats.assigned_requests}</strong>
        </div>

        <div className="dashboard-card">
          <h3>Completed Donations</h3>
          <strong>{stats.completed_donations}</strong>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;