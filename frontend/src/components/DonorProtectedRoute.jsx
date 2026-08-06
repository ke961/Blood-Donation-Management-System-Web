import { Navigate } from "react-router-dom";

function DonorProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token || (role !== "donor" && role !== "admin")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default DonorProtectedRoute;
