import { useLiveStore } from "../LiveStore";
import { runWorkflow } from "../../Shared/runWorkflow";
import { runActionConditions } from "../../Shared/runActionConditions";
import { BACKEND_URL } from "../../../config";

export async function runLiveActions(
  actions = [],
  allPages = [],
  setCurrentPage,
  appData,
  navigate,
  projectSlug,
  slugify,
  setSessionId
) {
  
  const toggleElementVisibility = (elements = [], targetId, hidden) => {
  return elements.map(el => {
    const newEl = { ...el };

    if (String(newEl.id) === String(targetId)) {
      newEl.hidden = hidden;
    }

    if (newEl.children?.length) {
      newEl.children = toggleElementVisibility(
        newEl.children,
        targetId,
        hidden
      );
    }

    return newEl;
  });
};

const store = useLiveStore.getState();
const setStore = useLiveStore.setState;
const VERSION_TYPE = "live";

// MUST match backend cookie logic
const cookieKey = `sessionId_${projectSlug}_${VERSION_TYPE}`; // cookie / LS
const storeKey  = `${projectSlug}_${VERSION_TYPE}`;           // zustand


    /* ------------------ LIVE NAVIGATION HELPER ------------------ */
  const getNavigationPath = (projectSlug, pageName, slugify) => {
    // localhost with project slug
    if (window.location.hostname.includes("localhost")) {
      return `/${projectSlug}/${slugify(pageName)}`;
    }

    // production
    return `/${slugify(pageName)}`;
  };

  
  /* ------------------ ACTION LOOP ------------------ */
  for (const action of actions) {
    const actionPassed = runActionConditions(action.conditions || [], {
  currentUser: store.currentUser?.[storeKey]
});



    if (!actionPassed) {
      console.log("⏭️ Action skipped due to conditions:", action);
      continue;
    }

    const actionType = String(action.actionType).trim().toLowerCase();

    /* -------- LOGIN GUARD -------- */
    const requiresLogin = !!action.requiresLogin;
const projectUser = store.currentUser?.[storeKey];


    if (requiresLogin && !projectUser) {
      const loginPageName = action.loginPage || "Login Page";
      const loginPage = allPages.find(
        p => p.name.toLowerCase() === loginPageName.toLowerCase()
      );

      if (loginPage) {
        const path = getNavigationPath(
  projectSlug,
  loginPage.name,
  slugify
);

        navigate(path);
      }
      return;
    }

    /* -------- ACTION TYPES -------- */
    switch (actionType) {

 case "login": {
  console.log("LOGIN ACTION:", action);

  const email = document.getElementById(String(action.email?.source))?.value || "";
  const password = document.getElementById(String(action.password?.source))?.value || "";
  if (!email || !password) {
    setStore({ authError: "Email and password are required" });
    return;
  }

  // 1️⃣ Login request
  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-login/?version_type=live`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // needed for cookies
      body: JSON.stringify({ email, password }),
    }
  );
  const data = await response.json();

  if (data.status !== "success") {
    setStore({ authError: data.message || "Invalid email or password" });
    return;
  }


setStore({
  sessionId: { ...store.sessionId, [storeKey]: data.sessionId },
  currentUser: { ...store.currentUser, [storeKey]: data.user },
  appdata: { ...store.appdata, loggedInUser: data.user },
     openPopupId: null,
    authError: null,
  });
// 3️⃣ Persist session for refresh (🔥 THIS FIXES LOGOUT ON REFRESH)
localStorage.setItem(
  `currentUser_${cookieKey}`,
  JSON.stringify(data.user)
);
localStorage.setItem(cookieKey, data.sessionId);

  // 4️⃣ Fetch LIVE runtime data
  const projectRes = await fetch(
    `${BACKEND_URL}/api/generate/projects/${projectSlug}/`,
    { credentials: "include", headers: { "Content-Type": "application/json" } }
  );
  const projectData = await projectRes.json();

  setStore({
    dbdata: projectData.db_list_data || {},
    dynamicValue: projectData.dynamic_value || {},
  });

  // Persist dbdata & dynamicValue
localStorage.setItem(
  `dbdata_${storeKey}`,
  JSON.stringify(projectData.db_list_data || {})
);
localStorage.setItem(
  `dynamicValue_${storeKey}`,
  JSON.stringify(projectData.dynamic_value || {})
);


  // 6️⃣ Run workflows triggered on login
  await runWorkflow(
    null,
    { type: "general", event: "user_logged_in" },
    store.workflows,
    store.runtimeTree.pages,
    setCurrentPage,
    store.appdata,
    navigate,
    projectSlug
  );

  break;
}
  case "create": {
  console.log("🆕 CREATE ACTION (LIVE):", action);

  const store = useLiveStore.getState();

  // 🔐 Get project-scoped sessionId
  let sessionId = store.sessionId?.[storeKey];

  if (!sessionId) {
    const match = document.cookie.match(
      new RegExp(`${cookieKey}=([^;]+)`)
    );
    if (match) sessionId = match[1];
  }

  if (!sessionId) {
    alert("Login required");
    return;
  }

  // 🧠 Build payload dynamically from fieldsMap
  const payload = {};
  Object.entries(action.fieldsMap || {}).forEach(([field, cfg]) => {
    if (!cfg?.source) return;

    const el = document.getElementById(String(cfg.source));
    if (!el) return;

    payload[field] = el[cfg.property || "value"];
  });

  console.log("📦 CREATE PAYLOAD:", payload);

  if (Object.keys(payload).length === 0) {
    alert("No data to create");
    return;
  }

  // 🏷 Thing type
  const thingType = action.thingType;
  if (!thingType) {
    console.warn("Missing thingType for create action");
    return;
  }

  try {
    // 🚀 CREATE API
    const response = await fetch(
      `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/data/${thingType}/?version_type=live`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log("🆕 CREATE RESPONSE:", data);

    if (data.status !== "success") {
      alert(data.message || "Create failed");
      return;
    }

    // ✅ Close popup
    setStore({ openPopupId: null });

    // 🔄 REFETCH LIVE RUNTIME DATA (same as login)
    const projectRes = await fetch(
      `${BACKEND_URL}/api/generate/projects/${projectSlug}/`,
      {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }
    );

    const projectData = await projectRes.json();

    // ✅ Update store
    setStore({
      dbdata: projectData.db_list_data || {},
      dynamicValue: projectData.dynamic_value || {},
    });

    // ✅ Persist for refresh safety
    localStorage.setItem(
      `dbdata_${storeKey}`,
      JSON.stringify(projectData.db_list_data || {})
    );
    localStorage.setItem(
      `dynamicValue_${storeKey}`,
      JSON.stringify(projectData.dynamic_value || {})
    );

    console.log("✅ LIVE CREATE + REFRESH DONE");
  } catch (err) {
    console.error("❌ Create failed:", err);
    alert("Create failed due to network error");
  }

  break;
}

case "show": {
  console.log("👉 SHOW ACTION TRIGGERED", action);

  const targetId = action.targetElementId;
  if (!targetId) break;

  const runtimeTree = useLiveStore.getState().runtimeTree;

  const newPages = runtimeTree.pages.map(page =>
    toggleElementVisibility([page], targetId, false)[0]
  );

  const newGlobalPopups = toggleElementVisibility(
    runtimeTree.globalPopups?.children || [],
    targetId,
    false
  );

  useLiveStore.setState({
    runtimeTree: {
      ...runtimeTree,
      pages: newPages,
      globalPopups: {
        ...runtimeTree.globalPopups,
        children: newGlobalPopups,
      },
    },
  });

  console.log("👉 ELEMENT SHOWN:", targetId);

  break;
}

case "hide": {
  const targetId = action.targetElementId;
  if (!targetId) break;

  const runtimeTree = useLiveStore.getState().runtimeTree;

  const newPages = runtimeTree.pages.map(page =>
    toggleElementVisibility([page], targetId, true)[0]
  );

  const newGlobalPopups = toggleElementVisibility(
    runtimeTree.globalPopups?.children || [],
    targetId,
    true
  );

  useLiveStore.setState({
    runtimeTree: {
      ...runtimeTree,
      pages: newPages,
      globalPopups: {
        ...runtimeTree.globalPopups,
        children: newGlobalPopups,
      },
    },
  });

  break;
}

case "make changes to current user": {
  console.log("🔥 MAKE CHANGES ACTION FIRED");

  const payload = {};
  Object.entries(action.fieldsMap || {}).forEach(([field, cfg]) => {
    if (!cfg?.source) return;

    const el = document.getElementById(cfg.source);
    if (!el) return;

    payload[field] = el[cfg.property || "value"];
  });

  console.log("💡 Payload:", payload);

  if (Object.keys(payload).length === 0) {
    alert("No fields to update");
    return;
  }

  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-update/?version_type=live`,
    {
      method: "PATCH",
      credentials: "include", // ✅ REQUIRED
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  console.log("Update response:", data);

  if (data.status !== "success") {
    alert(data.message || "Update failed");
    return;
  }

  // ✅ Sync runtime state
  const store = useLiveStore.getState();
  useLiveStore.setState({
    appdata: {
      ...store.appdata,
      loggedInUser: data.user,
    },
  });

  // ✅ Close popup
  useLiveStore.setState({ openPopupId: null });

  break;
}

// 🔐 NEW CASE FOR UPDATING EMAIL/PASSWORD
  case "update_user_credentials": {
  console.log("🔐 UPDATE USER CREDENTIALS");

  const store = useLiveStore.getState();
  const storeKey = `${projectSlug}_live`;
  const cookieKey = `sessionId_${projectSlug}_live`;

  // -------------------------------
  // 🔐 Resolve sessionId safely
  // -------------------------------
  let sessionId = store.sessionId?.[storeKey];

  // 1️⃣ Fallback → cookie
  if (!sessionId) {
    const match = document.cookie.match(
      new RegExp(`${cookieKey}=([^;]+)`)
    );
    if (match) sessionId = match[1];
  }

  // 2️⃣ Fallback → localStorage
  if (!sessionId) {
    sessionId = localStorage.getItem(cookieKey);
  }

  if (!sessionId) {
    alert("Login required");
    return;
  }

  // -------------------------------
  // 📦 Build payload
  // -------------------------------
  const payload = {
    email:
      document.getElementById(String(action.email?.source))?.value || "",
    oldPassword:
      document.getElementById(String(action.oldPassword?.source))?.value || "",
    password:
      document.getElementById(String(action.password?.source))?.value || "",
    confirmPassword:
      document.getElementById(
        String(action.confirmPassword?.source)
      )?.value || "",
  };

  console.log("🔐 Payload:", payload);

  // -------------------------------
  // 🧪 Validations
  // -------------------------------
  if (!payload.email && !payload.password) {
    alert("Nothing to update");
    return;
  }

  if (payload.password || payload.confirmPassword) {
    if (!payload.oldPassword) {
      alert("Old password is required");
      return;
    }

    if (!payload.password) {
      alert("New password is required");
      return;
    }

    if (!payload.confirmPassword) {
      alert("Confirm password is required");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
  }

  // -------------------------------
  // 🔁 API Call
  // -------------------------------
  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-credentials-update/?version_type=live`,
    {
      method: "PATCH",
      credentials: "include", // ✅ cookie auth
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  console.log("🔐 Response:", data);

  if (data.status !== "success") {
    alert(data.message || "Credential update failed");
    return;
  }

  // -------------------------------
  // ✅ Sync runtime store
  // -------------------------------
  useLiveStore.setState({
    currentUser: {
      ...store.currentUser,
      [storeKey]: data.user,
    },
    appdata: {
      ...store.appdata,
      loggedInUser: data.user,
    },
  });

  // -------------------------------
  // ✅ Close popup
  // -------------------------------
  useLiveStore.setState({ openPopupId: null });

  break;
}


case "signup": {
  console.log("SIGNUP ACTION:", action);

  const email =
    document.getElementById(String(action.email?.source))?.value || "";
  const password =
    document.getElementById(String(action.password?.source))?.value || "";
  const confirmPassword =
    document.getElementById(String(action.confirmPassword?.source))?.value || "";

  if (!email || !password) {
    setStore({ authError: "Email and password are required" });
    return;
  }

  if (password !== confirmPassword) {
    setStore({ authError: "Passwords do not match" });
    return;
  }

  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-signup/?version_type=live`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await response.json();

  if (data.status !== "success") {
    setStore({ authError: data.message || "Signup failed" });
    return;
  }


  setStore({
    sessionId: { ...store.sessionId, [storeKey]: data.sessionId },
    currentUser: { ...store.currentUser, [storeKey]: data.user },
    appdata: { ...store.appdata, loggedInUser: data.user },
    openPopupId: null,
    authError: null,
  });

  localStorage.setItem(cookieKey, data.sessionId);
  localStorage.setItem(
    `currentUser_${cookieKey}`,
    JSON.stringify(data.user)
  );

  /* ---------- FETCH RUNTIME ---------- */

  const projectRes = await fetch(
    `${BACKEND_URL}/api/generate/projects/${projectSlug}/`,
    {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }
  );

  const projectData = await projectRes.json();

  setStore({
    dbdata: projectData.db_list_data || {},
    dynamicValue: projectData.dynamic_value || {},
  });

  localStorage.setItem(
    `dbdata_${storeKey}`,
    JSON.stringify(projectData.db_list_data || {})
  );

  localStorage.setItem(
    `dynamicValue_${storeKey}`,
    JSON.stringify(projectData.dynamic_value || {})
  );

  /* ---------- NAVIGATION ---------- */

  const dashboard =
    action.targetPageId !== undefined
      ? allPages.find((p) => String(p.id) === String(action.targetPageId))
      : allPages.find(
          (p) => p.name.toLowerCase() === action.targetPage?.toLowerCase()
        );

  await runWorkflow(
    null,
    { type: "general", event: "user_signed_up" },
    store.workflows,
    store.runtimeTree.pages,
    setCurrentPage,
    store.appdata,
    navigate,
    projectSlug
  );

  if (dashboard) {
    setCurrentPage(dashboard.id);
    navigate(getNavigationPath(projectSlug, dashboard.name, slugify));
  }

  break;
}

      case "navigate": {
        const targetPage =
          action.targetPageId !== undefined
            ? allPages.find(p => String(p.id) === String(action.targetPageId))
            : allPages.find(
                p =>
                  p.name.toLowerCase() ===
                  action.targetPage?.toLowerCase()
              );

        if (!targetPage) {
          console.warn("🚨 Live navigate: target page not found");
          break;
        }

        const path = getNavigationPath(
          projectSlug,
          targetPage.name,
          slugify
        );

        navigate(path);
        break;
      }
    
       

case "logout": {
  console.log("LOGOUT ACTION:", action);

  // 1️⃣ Backend logout
  await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/logout/?version_type=live`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  // 2️⃣ Clear zustand (project-scoped)
  useLiveStore.setState((state) => ({
  sessionId: {
    ...state.sessionId,
    [storeKey]: null,
  },
  currentUser: {
    ...state.currentUser,
    [storeKey]: null,
  },
  loggedInUser: {
    ...state.loggedInUser,
    [storeKey]: null,
  },
  appdata: {
    ...state.appdata,
    loggedInUser: null,
  },
}));


localStorage.removeItem(`currentUser_${cookieKey}`);
localStorage.removeItem(`dbdata_${storeKey}`);
localStorage.removeItem(`dynamicValue_${storeKey}`);


  break;
}

      case "open_popup": {
  const popupId = action.popupId;
  if (!popupId) break;

  // Set popup open state in runtime store
  useLiveStore.setState({ openPopupId: popupId });
  break;
}

case "close_popup": {
  const popupId = action.popupId;
  if (!popupId) break;

  // Only close if the popup is currently open
  const currentOpen = useLiveStore.getState().openPopupId;
  if (currentOpen === popupId) {
    useLiveStore.setState({ openPopupId: null });
  }
  break;
}



  
      






      case "alert":
        alert(action.message || "(empty alert)");
        break;

      case "console_log":
        console.log(action.message);
        break;



case "refresh": {
  console.log("🔄 REFRESH ACTION");

  // Full hard refresh
  window.location.reload();
  break;
}

case "previous":
case "previous_page": {
  console.log("⬅️ PREVIOUS PAGE ACTION");

  // Go back one step in history
  navigate(-1);
  break;
}


      default:
        console.warn("Unknown action:", action.actionType); // ✅ updated
        console.warn("❌ UNHANDLED ACTION TYPE:", actionType);
      }
  }
}
