import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(loginData);

    // Connect FastAPI here later
    alert("Login Successful");

    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>🩸 Blood Donation</h1>
        <h2>Welcome Back</h2>

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
                onChange={() => setShowPassword(!showPassword)}
              />
              Show Password
            </label>

            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit">
            Login
          </button>

        </form>

        <p>
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>

      </div>
    </div>
  );
}

export default Login;