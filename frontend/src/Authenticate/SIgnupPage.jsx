import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState("");

  // ✅ Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const getPasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  let strength = "Weak";
  if (passed >= 4) strength = "Medium";
  if (passed === 5) strength = "Strong";

  return { strength, checks };
};
const [showPassword, setShowPassword] = useState(false);
const { strength, checks } = getPasswordStrength(formData.password);

  // ✅ Handle signup form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple password check
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/signup/`,
        {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Handle success
      if (response.status === 201) {
        setSuccess("Account created successfully! Redirecting to login...");

setTimeout(() => {
  navigate("/login");
}, 2000);

      }
    } catch (err) {
      console.error("Signup error:", err);

      if (err.response) {
        // ✅ Handle known backend responses
        const data = err.response.data;
        console.log("Backend response:", data);
        setError(
          data.error ||
            data.message ||
            data.detail ||
            "Signup failed. Try again."
        );
      } else if (err.request) {
        setError("Network error — backend not reachable or CORS issue.");
      } else {
        setError("Error setting up request: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl">
      <h2 className="text-2xl font-semibold text-center text-gray-700">
        Create an Account
      </h2>

      {error && <p className="text-red-500 text-center">{error}</p>}
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

        {/* Email */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={formData.email}
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

          {/* Strength */}
          {formData.password && (
            <p
              className={`text-sm mt-1 font-medium ${
                strength === "Weak"
                  ? "text-red-500"
                  : strength === "Medium"
                  ? "text-yellow-500"
                  : "text-green-600"
              }`}
            >
              Password strength: {strength}
            </p>
          )}

          {/* Checklist */}
          {formData.password && (
            <ul className="text-sm mt-2 space-y-1">
              <li className={checks.length ? "text-green-600" : "text-gray-400"}>
                ✔ At least 8 characters
              </li>
              <li className={checks.uppercase ? "text-green-600" : "text-gray-400"}>
                ✔ One uppercase letter
              </li>
              <li className={checks.lowercase ? "text-green-600" : "text-gray-400"}>
                ✔ One lowercase letter
              </li>
              <li className={checks.number ? "text-green-600" : "text-gray-400"}>
                ✔ One number
              </li>
              <li className={checks.special ? "text-green-600" : "text-gray-400"}>
                ✔ One special character
              </li>
            </ul>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-600">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-300"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Login here
        </Link>
      </p>
    </div>
  </div>
);


}
