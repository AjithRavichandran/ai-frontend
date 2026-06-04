import "./App.css";
import "react-phone-number-input/style.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import Preview from "./Renderer/PreviewRoot/Preview";
import CanvasRoot from "./Canvas/CanvasRoot"
import Live from "./Renderer/LiveRoot/Live";
// 🧠 Zustand store for auth
import { useAuthStore } from "./authStore";
import ProjectStatusChecker from "./ProjectStatusChecker";

// 🧩 UI Components
import Navbar from "./Navbar";
import ScrollToTop from "./Components/ScrollToTop";
import Footer from "./Components/Footer/Footer";

import PaymentSubmitted from "./Canvas/Canvasnavbar/PaymentSubmitted";
// 🧭 Pages
import LandingPage from "./Components/LandingPage";
import CodeViewer from "./Components/CodeViewer";
import AIPromptPage from "./aipromptpage";

import ProjectPage from "./ProjectPage";
import DeploySuccess from "./Canvas/Canvasnavbar/DeploySuccess";
import ProjectUpdated from "./Canvas/Canvasnavbar/ProjectUpdated";

// 🧾 Auth pages
import LoginPage from "./Authenticate/LoginPage";
import SignupPage from "./Authenticate/SIgnupPage";

import ForgotPasswordPage from "./password/ForgotPasswordPage";
import ResetPasswordPage from "./password/ResetPasswordPage";

/* ==========================================================
   ✅ ProtectedRoute — restricts access to logged-in users
   ========================================================== */
function ProtectedRoute({ element }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthChecked = useAuthStore((s) => s.isAuthChecked);

  // Wait for auth check before deciding
if (!isAuthChecked) return null;


  return accessToken ? element : <Navigate to="/login" replace />;
}

/* ==========================================================
   ✅ Main App Content — Handles navbar/footer visibility
   ========================================================== */
function AppContent() {
  const location = useLocation(); // ✅ correct position
const LIVE_DOMAIN = process.env.REACT_APP_LIVE_DOMAIN; // pclinfotech.com

  const hideOnRoutes = ["/editor", "/login", "/signup", "/preview"];
const segments = location.pathname.split("/").filter(Boolean);

const RESERVED = ["preview", "editor", "login", "signup", "deploy", "project-updated"];

const isLocalLive =
  process.env.NODE_ENV === "development" &&
  segments.length === 2 &&
  !RESERVED.includes(segments[0]);

  const hostname = window.location.hostname;

  const MAIN_APP_HOSTS = [
  "ai.pclinfotech.com", // ✅ your main app
  "localhost",
];

const isProdLive =
  hostname.endsWith(LIVE_DOMAIN) &&
  !MAIN_APP_HOSTS.includes(hostname);

  const shouldHide =
    isLocalLive || isProdLive || hideOnRoutes.some(r => location.pathname.startsWith(r));

  return (
    <div>
      {/* ✅ Add ProjectStatusChecker globally */}
      <ProjectStatusChecker />
      {!shouldHide && <Navbar />}

      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        // ✅ Add Forgot/Reset Password
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

        <Route path="/payment-submitted/:projectSlug" element={<PaymentSubmitted />} />
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/prompt" element={<AIPromptPage />} />
        {/* Deployment / Project Updated */}
<Route path="/deploy/success/:projectSlug/:pageSlug" element={<DeploySuccess />} />
<Route path="/project-updated/:projectSlug/:pageSlug" element={<ProjectUpdated />} />

        {/* Protected */}
        <Route path="/editor/:projectSlug" element={<ProtectedRoute element={<CanvasRoot />} />} />
        <Route path="/preview/:projectSlug/:pageName" element={<ProtectedRoute element={<Preview />} />} />
        <Route path="/codeviewer" element={<ProtectedRoute element={<CodeViewer />} />} />
        <Route path="/projects" element={<ProtectedRoute element={<ProjectPage />} />} />

        {/* 🔥 Live Rendering Routes */}
        {process.env.NODE_ENV === "development" && (
          <Route path="/:projectSlug/:pageName" element={<Live />} />
        )}
        <Route path="/:pageName" element={<Live />} />

        {/* Fallback */}
        <Route path="*" element={<div>404 — Page not found</div>} />
      </Routes>

      {!shouldHide && <Footer />}
    </div>
  );
}

/* ==========================================================
   ✅ Root App — handles persistent login refresh
   ========================================================== */
function App() {
  const LIVE_DOMAIN = process.env.REACT_APP_LIVE_DOMAIN;

  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  const pathname = window.location.pathname;
const hostname = window.location.hostname;

// Dev Live: two segments but not preview/editor
const devSegments = pathname.split("/").filter(Boolean); // removes empty strings
const RESERVED = ["preview", "editor", "login", "signup", "deploy", "project-updated"];

const isDevLive =
  process.env.NODE_ENV === "development" &&
  devSegments.length === 2 &&
  !RESERVED.includes(devSegments[0]);

// Prod Live: 1 segment after domain (not localhost or main domains)
const MAIN_APP_HOSTS = [
  "ai.pclinfotech.com",
  "localhost",
];

const isProdLive =
  hostname.endsWith(LIVE_DOMAIN) &&
  !MAIN_APP_HOSTS.includes(hostname);

// Final Live detection
const isLiveRoute = isDevLive || isProdLive;

  useEffect(() => {
    if (!isLiveRoute) {
      // Only refresh auth on non-live pages
      initializeAuth();
    }
  }, [initializeAuth, isLiveRoute]);


  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </HelmetProvider>
  );
}

export default App;
