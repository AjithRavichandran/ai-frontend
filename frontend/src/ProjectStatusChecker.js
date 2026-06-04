import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";
import { BACKEND_URL } from "./config";

export default function ProjectStatusChecker() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean);

    let projectSlug = null;

    // ✅ editor/:projectSlug
    if (
      segments[0] === "editor" &&
      segments[1]
    ) {
      projectSlug = segments[1];
    }

    // ✅ preview/:projectSlug
    else if (
      segments[0] === "preview" &&
      segments[1]
    ) {
      projectSlug = segments[1];
    }

    // ✅ deploy/success/:projectSlug/...
    else if (
      segments[0] === "deploy" &&
      segments[1] === "success" &&
      segments[2]
    ) {
      projectSlug = segments[2];
    }

    // ✅ project-updated/:projectSlug/...
    else if (
      segments[0] === "project-updated" &&
      segments[1]
    ) {
      projectSlug = segments[1];
    }

    // 🚫 ABSOLUTELY NO guessing for live or random routes
    if (!projectSlug) return;

    const checkProjectStatus = async () => {
      try {
        const token = localStorage.getItem("access_token");

        await useAuthStore.getState().refreshUser(projectSlug);

        const res = await fetch(
          `${BACKEND_URL}/api/payments/projects/${projectSlug}/status-or-expire/`,
          {
            credentials: "include",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();

        if (data.expired_now) {
          alert(`Project "${projectSlug}" has expired.`);
          navigate("/projects");
        }
      } catch (err) {
        console.error("Project status check failed:", err);
      }
    };

    checkProjectStatus();
  }, [location.pathname, navigate]);

  return null;
}
