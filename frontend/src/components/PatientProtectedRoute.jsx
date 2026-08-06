import { Navigate } from "react-router-dom";

function PatientProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token || (role !== "patient" && role !== "admin")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PatientProtectedRoute;
