// src/config.js
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

if (!BACKEND_URL) {
  console.error("❌ REACT_APP_BACKEND_URL is not defined");
}

console.log("ENV MODE:", process.env.NODE_ENV);
console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);
