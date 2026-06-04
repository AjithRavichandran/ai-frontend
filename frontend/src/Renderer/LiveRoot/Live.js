// src/Live.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LiveRenderer from "../LiveRoot/LiveRenderer/liveRenderer";
import { useLiveStore } from "./LiveStore";
import { runWorkflow } from '../Shared/runWorkflow';
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config";
export default function Live() {
  // Destructure both params and rename
const { pageName: paramPageName, projectSlug: paramSlug } = useParams();

// Determine projectSlug for dev vs prod
const projectSlug =
  window.location.hostname.includes("localhost") ? paramSlug : window.location.hostname.split(".")[0];

// Determine pageName for dev vs prod
const pageName =
  window.location.hostname.includes("localhost")
    ? paramPageName
    : window.location.pathname.split("/")[1];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    runtimeTree,
    setActivePage,
    workflows,
    datatypes,
    appdata,
    dbdata,
    hydrateSessionFromCookie,
  } = useLiveStore();

  const normalizeSlug = (name) =>
    name
      ?.toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

  const navigate = useNavigate();
const pages = runtimeTree?.pages || [];

const activePage =
  pages.find((p) => {
    const slug = normalizeSlug(p.name);
    return slug === pageName || slug.startsWith(pageName);
  }) || pages[0] || null;


const liveStore = useLiveStore.getState(); // 🔥 imperative store

useEffect(() => {
  if (!activePage?.id || !workflows?.length) return;

  runWorkflow(
    null,                     // elementId
    { type: "general", event: "page_loaded" }, // trigger
    workflows,                // workflows
    runtimeTree?.pages || [], // allPages
    setActivePage,            // setCurrentPage
    appdata,                  // appData
    navigate,                 // navigate
    projectSlug,              // projectSlug
  );
}, [
  activePage?.id,
  workflows,
  runtimeTree?.pages,
  setActivePage,
  appdata,
  navigate,
  projectSlug
]);


  // hydrate session from cookie if needed
useEffect(() => {
  if (!projectSlug) return;

  // Immediately hydrate session from cookie/localStorage
  hydrateSessionFromCookie(projectSlug);
}, [projectSlug]);

  // fetch live runtime JSON
  useEffect(() => {
    const fetchRuntime = async () => {
      try {
        // ✅ Public endpoint — no credentials / auth
        const url = `${BACKEND_URL}/api/generate/projects/${projectSlug}/`;
        const res = await fetch(url, {
  credentials: "include",
});

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 402) {
            if (data.reason === "no_subscription") {
              setError("This project is not subscribed.");
            } else if (data.reason === "subscription_expired") {
              setError("Subscription expired. Please renew.");
            } else if (data.reason === "not_deployed") {
              setError("Project has not been deployed yet.");
            } else {
              setError("Live access not available.");
            }
          } else {
            setError("Failed to load live page.");
          }
          return;
        }

const VERSION_TYPE = "live";
const key = `${projectSlug}_${VERSION_TYPE}`;

useLiveStore.setState((state) => ({
  runtimeTree: data.schema || {},
  dbdata: data.db_list_data || {},
  dynamicValue: data.dynamic_value || {},
  workflows: data.workflows || [],
  datatypes: data.datatypes || [],
  appdata: data.appdata || {},

  // 🔐 AUTH — backend is the source of truth
currentUser: {
  ...state.currentUser,
  [key]: data.loggedInUser ?? null,
},
loggedInUser: {
  ...state.loggedInUser,
  [key]: data.loggedInUser ?? null,
},
sessionId: {
  ...state.sessionId,
  [key]: data.loggedInUser ? state.sessionId?.[key] : null,
},


  isSessionHydrated: true,
}));

      } catch (err) {
        console.error(err);
        setError("Failed to load live page");
      } finally {
        setLoading(false);
      }
    };

    if (projectSlug && pageName) fetchRuntime();
  }, [projectSlug, pageName, hydrateSessionFromCookie]);

if (error) return <div>{error}</div>;

// ⛔ Don't show 404 until fetch is done
if (!runtimeTree?.pages?.length && !loading) {
  return <div>Page not found</div>;
}

// While loading, render nothing (or skeleton)
if (loading) return null;

  console.log(
    "LIVE ROUTE DEBUG",
    JSON.stringify(
      {
        pathname: window.location.pathname,
        pageName,
        projectSlug,
        pages: runtimeTree.pages.map((p) => normalizeSlug(p.name)),
        activePage: normalizeSlug(activePage?.name),
      },
      null,
      2
    )
  );

  return (
  <div style={{ minHeight: "100vh", padding: 10 }}>

    {/* Page content */}
    {(activePage.children || []).map((child) => (
      <LiveRenderer
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
        mode="live"
      />
    ))}

    {/* ✅ GLOBAL POPUPS (MISSING PIECE) */}
    {runtimeTree?.globalPopups?.children?.map((popup) => (
      <LiveRenderer
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
        mode="live"
      />
    ))}
  </div>
);

}
