// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Login.css";

// function Login() {
//   const navigate = useNavigate();

//   const [loginData, setLoginData] = useState({
//     email: "",
//     password: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);

//   const handleChange = (e) => {
//     setLoginData({
//       ...loginData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     console.log(loginData);

//     // Connect FastAPI here later
//     alert("Login Successful");

//     navigate("/dashboard");
//   };

//   return (
//     <div className="login-container">
//       <div className="login-card">

//         <h1>🩸 Blood Donation</h1>
//         <h2>Welcome Back</h2>

//         <form onSubmit={handleSubmit}>

//           <input
//             type="email"
//             name="email"
//             placeholder="Email Address"
//             value={loginData.email}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type={showPassword ? "text" : "password"}
//             name="password"
//             placeholder="Password"
//             value={loginData.password}
//             onChange={handleChange}
//             required
//           />

//           <div className="options">
//             <label>
//               <input
//                 type="checkbox"
//                 onChange={() => setShowPassword(!showPassword)}
//               />
//               Show Password
//             </label>

//             <a href="#">Forgot Password?</a>
//           </div>

//           <button type="submit">
//             Login
//           </button>

//         </form>

//         <p>
//           Don't have an account?
//           <Link to="/register"> Register</Link>
//         </p>

//       </div>
//     </div>
//   );
// }

// export default Login;



import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post("/auth/login", loginData);

      const { access_token, role, user } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "donor") {
        navigate("/donor/dashboard");
      } else if (role === "patient") {
        navigate("/patient/dashboard");
      } else {
        setErrorMessage("Invalid user role.");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🩸 Blood Donation</h1>
        <h2>Welcome Back</h2>

        {errorMessage && (
          <div className="login-error">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={loginData.email}
            onChange={handleChange}
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleChange}
            required
          />

          <div className="options">
            <label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() =>
                  setShowPassword(!showPassword)
                }
              />
              Show Password
            </label>

            <a href="#">Forgot Password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;