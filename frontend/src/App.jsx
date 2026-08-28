import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import AdminDashboard from "./admin/AdminDashboard";
import DonorDashboard from "./Pages/DonorDashboard";
import PatientDashboard from "./Pages/PatientDashboard";
import HospitalDashboard from "./Pages/HospitalDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import DonorProtectedRoute from "./components/DonorProtectedRoute";
import PatientProtectedRoute from "./components/PatientProtectedRoute";
import HospitalProtectedRoute from "./components/HospitalProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/donor/dashboard"
          element={
            <DonorProtectedRoute>
              <DonorDashboard />
            </DonorProtectedRoute>
          }
        />

        <Route
          path="/patient/dashboard"
          element={
            <PatientProtectedRoute>
              <PatientDashboard />
            </PatientProtectedRoute>
          }
        />

        <Route
          path="/hospital/dashboard"
          element={
            <HospitalProtectedRoute>
              <HospitalDashboard />
            </HospitalProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;