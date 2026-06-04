// src/Preview.js
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import PreviewRenderer from "./PreviewRenderer/previewRenderer";
import { usePreviewStore } from "./PreviewStore";
import { runWorkflow } from '../Shared/runWorkflow';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from '../../authStore';
import { BACKEND_URL } from "../../config";

export default function Preview() {
  const { projectSlug, pageName } = useParams();

  const {
    isSessionHydrated,
    runtimeTree,
    setActivePage,
    workflows,
    datatypes,
    appdata,
    dbdata,
    activePageId,
  } = usePreviewStore();
const VERSION_TYPE = "preview";

const navigate = useNavigate();
const location = useLocation();

const [loading, setLoading] = useState(true);
const previewStore = usePreviewStore.getState();

  useEffect(() => {
    setLoading(true);
  }, []);

  const [noAuth, setNoAuth] = useState(false);
  const [error, setError] = useState(null);


  const hydrateSessionFromCookie = usePreviewStore(
    (state) => state.hydrateSessionFromCookie
  );

  useEffect(() => {
  if (projectSlug) {
hydrateSessionFromCookie(projectSlug, VERSION_TYPE);
  }
}, [hydrateSessionFromCookie, projectSlug]);

  // ----------------------------
  // Stable slugify function
  // ----------------------------
  const slugify = useMemo(
    () => (text) =>
      text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-"),
    []
  );

  // ----------------------------
  // Fetch runtime data (JWT only)
  // ----------------------------
useEffect(() => {
  if (!projectSlug || !isSessionHydrated) return;

  const fetchRuntimeAndSubscription  = async () => {
    const startTime = Date.now();

    try {
      const token = localStorage.getItem("access_token");

      // --- Fetch subscription status by refreshing user ---
      await useAuthStore.getState().refreshUser(projectSlug);

      const user = useAuthStore.getState().user;
      console.log("Latest plan:", user?.liveusageplan);

      // --- Fetch runtime ---
      const res = await fetch(
        `${BACKEND_URL}/api/generate/projects/runtime/${projectSlug}/?version_type=${VERSION_TYPE}`,        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      if (res.status === 401 || res.status === 403) {
  setNoAuth(true);
  return;
}

      if (!res.ok) throw new Error(`Failed to fetch project (${res.status})`);

      const data = await res.json();
      const key = `${projectSlug}_preview`;

      usePreviewStore.setState((state) => ({
        currentUser: {
          ...state.currentUser,
          ...(data.loggedInUser ? { [key]: data.loggedInUser } : {}),
        },
        loggedInUser: {
          ...state.loggedInUser,
          ...(data.loggedInUser ? { [key]: data.loggedInUser } : {}),
        },
        runtimeTree: data.schema || {},
        dbdata: data.db_list_data || {},
        dynamicValue: data.dynamic_value || {},
        workflows: data.workflows || [],
        datatypes: data.datatypes || [],
        appdata: data.appdata || {},
        isSessionHydrated: true,
      }));

      localStorage.setItem(`dbdata_${key}`, JSON.stringify(data.db_list_data || {}));
      localStorage.setItem(`dynamicValue_${key}`, JSON.stringify(data.dynamic_value || {}));

    } catch (err) {
      console.error("Failed to fetch runtime or subscription:", err);
      setError("Failed to load project data.");
      setNoAuth(true);
      usePreviewStore.setState({ isSessionHydrated: true });
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);

      setTimeout(() => {
        setLoading(false);
      }, remaining);
    }
  };

  // ✅ Call the correct function
  fetchRuntimeAndSubscription();
}, [projectSlug, isSessionHydrated]);

useEffect(() => {
  if (noAuth) {
    navigate("/login", {
      replace: true,
      state: { from: location.pathname },
    });
  }
}, [noAuth, navigate, location.pathname]);


  // ----------------------------
  // Update active page on URL change
  // ----------------------------
  useEffect(() => {
    if (!runtimeTree?.pages?.length || !pageName) return;

    const slug = decodeURIComponent(pageName).toLowerCase();
    const page = runtimeTree.pages.find((p) => slugify(p.name) === slug);

    if (page && page.id !== activePageId) setActivePage(page.id);
  }, [pageName, runtimeTree?.pages, slugify, setActivePage, activePageId]);
// ----------------------------
// Page Loaded Workflow Trigger (START POINT)
// ----------------------------
useEffect(() => {
  if (!activePageId || !workflows?.length) return;

  runWorkflow(
    null, // elementId
    {
      type: "general",
      event: "page_loaded",
    },
    workflows,                    // workflows
    runtimeTree?.pages || [],      // pages
    setActivePage,                // setCurrentPage
    appdata,                      // appData
    navigate,                     // navigate
    projectSlug,                  // projectSlug
  );
}, [
  activePageId,
  workflows,
  runtimeTree?.pages,
  setActivePage,
  appdata,
  navigate,
  projectSlug
]);

  // ----------------------------
  // Guards
  // ----------------------------
if (loading || !isSessionHydrated) {
  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-black via-gray-900 to-black px-4">

      <div className="relative w-full max-w-md rounded-3xl overflow-hidden
        bg-gradient-to-br from-gray-700 to-gray-800
        border border-gray-600 shadow-2xl">

        {/* subtle glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2
          w-48 h-48 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-400" />

        {/* Content */}
        <div className="relative p-10 flex flex-col items-center text-center gap-5">

          {/* Logo badge */}
          <div className="w-14 h-14 rounded-2xl
            bg-gradient-to-br from-blue-600 to-blue-500
            flex items-center justify-center
            text-white font-bold text-xl shadow-lg">
            P
          </div>

          <h2 className="text-2xl font-semibold text-white tracking-wide">
            Preparing Preview
          </h2>

          <p className="text-sm text-gray-300 max-w-xs leading-relaxed">
            Initializing runtime, workflows, and UI components
          </p>

          {/* Spinner */}
          <div className="mt-2 relative w-12 h-12">
            <div className="absolute inset-0 rounded-full
              border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full
              border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>

          <span className="text-xs text-gray-400 tracking-wide">
            This may take a moment
          </span>
        </div>
      </div>
    </div>
  );
}
  if (error) return <div style={{ color: "red" }}>{error}</div>;

const activePage = runtimeTree.pages.find((p) => p.id === activePageId);
if (!activePage) return <div>Page not found</div>;

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: activePage.backgroundColor || "#fff",
        padding: 10,
        boxSizing: "border-box",
      }}
    >
      {/* Page content */}
      {(activePage.children || []).map((child) => (
        <PreviewRenderer
          key={child.id}
          element={child}
          workflows={workflows}
          datatypes={datatypes}
          appdata={appdata}
          dbdata={dbdata}
          activePageId={activePage.id}
          setActivePage={setActivePage}
          runtimeTree={runtimeTree}
          projectSlug={projectSlug}  
        />
      ))}

      {/* Global popups */}
{(runtimeTree?.globalPopups?.children || []).map((popup) => (        <PreviewRenderer
          key={popup.id}
          element={popup}
          workflows={workflows}
          datatypes={datatypes}
          appdata={appdata}
          dbdata={dbdata}
          activePageId={activePage.id}
          setActivePage={setActivePage}
          runtimeTree={runtimeTree}
          projectSlug={projectSlug}
        />
      ))}
    </div>
  );
}
