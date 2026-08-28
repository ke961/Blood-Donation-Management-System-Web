import { Navigate } from "react-router-dom";

function HospitalProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token || (role !== "hospital" && role !== "admin")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default HospitalProtectedRoute;
