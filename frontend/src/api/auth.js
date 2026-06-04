// src/api/auth.js
import axios from "axios";
import { BACKEND_URL } from "../config";

// Send password reset email
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/forgot-password/`,
      { email },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (err) {
    throw err.response?.data || { error: "Failed to send reset email" };
  }
};

// Reset password with uid and token
export const resetPassword = async (uid, token, password) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/reset-password/${uid}/${token}/`,
      { password },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (err) {
    throw err.response?.data || { error: "Failed to reset password" };
  }
};