import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../authStore"; // ✅ import Zustand store
import { useNavigate, Link, useLocation } from "react-router-dom";
import { BACKEND_URL } from "../config";
export default function LoginPage() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore(); // ✅ Zustand actions
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const location = useLocation();
const redirectTo = location.state?.from || "/prompt";
const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/login/`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true, // ✅ sends refresh cookie
        }
      );

      if (response.status === 200) {
        const { access, refresh, username, email, user } = response.data;

        // ✅ Store access token using Zustand (and persist in localStorage)
        if (access) setAccessToken(access);

        // ✅ Save user info in Zustand
        if (user) setUser(user);
        else setUser({ username, email });

        // ✅ Optional: store refresh manually if you want
        if (refresh) localStorage.setItem("refresh_token", refresh);

        console.log("Login success:", response.data);
        setSuccess("Login successful! Redirecting...");

setTimeout(() => {
  navigate(redirectTo);
}, 1200);

      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl font-semibold text-center text-gray-700">
        Login to Your Account
      </h2>

      {error && (
  <p className="text-red-500 text-center font-medium">{error}</p>
)}

{success && (
  <p className="text-green-600 text-center font-medium">
    {success}
  </p>
)}


      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Username */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Username
          </label>
          <input
            type="text"
            name="username"
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Forgot Password Link */}
<p className="text-center mt-2 text-sm text-gray-500">
  <Link to="/forgot-password" className="text-blue-600 hover:underline">
    Forgot Password?
  </Link>
</p>

      <p className="text-center text-sm text-gray-500">
        Don’t have an account?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  </div>
);

}
