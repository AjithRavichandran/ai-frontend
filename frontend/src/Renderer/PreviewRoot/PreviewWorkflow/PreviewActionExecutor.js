import { usePreviewStore } from "../PreviewStore";
import { runWorkflow } from "../../Shared/runWorkflow";
import { runActionConditions } from "../../Shared/runActionConditions";
import { BACKEND_URL } from "../../../config";

export async function runPreviewActions(
  actions = [],
  allPages = [],
  setCurrentPage,
  appData,
  navigate,
  projectSlug,
  slugify
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

  const previewPath = (pageName) =>
    `/preview/${projectSlug}/${slugify(pageName)}`;

  console.log("▶️ RUN PREVIEW ACTIONS", actions);

  for (const action of actions) {
    const store = usePreviewStore.getState();
const key = `${projectSlug}_preview`;
const currentUser = store.currentUser?.[key];

    /* ✅ CONDITIONS */
    const actionPassed = runActionConditions(
      action.conditions || [],
      { currentUser }
    );

    if (!actionPassed) {
      console.log("⏭️ Action skipped:", action);
      continue;
    }

    const actionType = String(action.actionType || "")
      .trim()
      .toLowerCase();

    /* 🔐 LOGIN REQUIRED */
    if (action.requiresLogin && !currentUser) {
      const loginPageName = action.loginPage || "Login Page";
      const loginPage = allPages.find(
        p => p.name.toLowerCase() === loginPageName.toLowerCase()
      );

      if (loginPage) {
navigate(previewPath(loginPage.name));
      }
      return;
    }

    switch (actionType) {

      case "login": {
  console.log("LOGIN ACTION:", action);
  const email = document.getElementById(String(action.email?.source))?.value || "";
  const password = document.getElementById(String(action.password?.source))?.value || "";
  console.log("EMAIL / PASSWORD:", email, password);

  if (!email || !password) {
    usePreviewStore.getState().setAuthError("Email and password are required");
    return;
  }

  const response = await fetch(
  `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-login/?version_type=preview`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  }
);

  const data = await response.json();

  if (data.status !== "success") {
    usePreviewStore.getState().setAuthError(data.message || "Invalid email or password");
    return;
  }

  // Close popup
  usePreviewStore.setState({ openPopupId: null });

  // Save session and current user
const key = `${projectSlug}_preview`;
usePreviewStore.getState().setCurrentUser(data.user, key);

  // Fetch latest project data to update dbdata & dynamicValue
  const projectRes = await fetch(
    `${BACKEND_URL}/api/generate/projects/runtime/${projectSlug}/`,
    {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }
  );
  const projectData = await projectRes.json();

  // Update store immediately
  usePreviewStore.setState({
    dbdata: projectData.db_list_data || {},
    dynamicValue: projectData.dynamic_value || {},
    appdata: {
  ...projectData.appdata,
  loggedInUser: data.user,
}
,
  });

  usePreviewStore.getState().setSession(data.user, data.sessionId, projectSlug);

localStorage.setItem(`dbdata_${key}`,JSON.stringify(projectData.db_list_data || {}));
localStorage.setItem(`dynamicValue_${key}`,JSON.stringify(projectData.dynamic_value || {}));

  // Navigate to dashboard
  const dashboard =
    action.targetPageId !== undefined
      ? allPages.find((p) => String(p.id) === String(action.targetPageId))
      : allPages.find((p) => p.name.toLowerCase() === action.targetPage?.toLowerCase());

  await runWorkflow(
    null,
    { type: "general", event: "user_logged_in" },
    usePreviewStore.getState().workflows,
    usePreviewStore.getState().runtimeTree.pages,
    setCurrentPage,
    usePreviewStore.getState().appdata,
    navigate,
    projectSlug
  );


  break;
}

case "create": {
  console.log("🆕 CREATE ACTION:", action);

  const store = usePreviewStore.getState();

  // 🔐 Require login
  let sessionId = store.sessionId;
  if (!sessionId) {
    // Check for actual project-specific cookie
    const cookieName = `sessionId_${projectSlug}_preview`;
    const match = document.cookie.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) sessionId = match[1];
  }

  if (!sessionId) {
    alert("Login required");
    return;
  }

  // 🧠 Build payload dynamically from fieldsMap
  const payload = { fieldsMap: {} };
Object.entries(action.fieldsMap || {}).forEach(([field, cfg]) => {
  console.log("Processing field:", field, "cfg:", cfg);

  if (!cfg?.source) {
    console.log("Skipping field (no source)", field);
    return;
  }

  const el = document.getElementById(String(cfg.source));
  console.log("Found element:", el);

  if (!el) {
    console.log("Skipping field (element not in DOM)", field);
    return;
  }

  payload.fieldsMap[field] = { value: el[cfg.property || "value"] };
  console.log("Added to payload:", field, payload.fieldsMap[field]);
});


  console.log("📦 FINAL CREATE PAYLOAD:", payload);

console.log("Payload fieldsMap before check:", payload.fieldsMap);

  if (Object.keys(payload.fieldsMap).length === 0) {
    console.warn("Create skipped: no fields found");
    return;
  }

  // 🏷 Thing type (e.g. products, posts, orders, etc.)
  const thingType = action.thingType;
  if (!thingType) {
    console.warn("Missing thingType for create action");
    return;
  }

  // 🚀 API call
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/data/${thingType}/?version_type=preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Backend uses cookie for session, but keep Authorization in case you switch to token-based auth
          Authorization: `Bearer ${sessionId}`,
        },
        credentials: "include", // Important to send cookies
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log("🆕 CREATE RESPONSE:", data);

    if (data.status !== "success") {
      alert(data.message || "Create failed");
      return;
    }

    // ✅ Optional: close popup after success
    usePreviewStore.setState({ openPopupId: null });

    // 🔁 Optional: trigger workflow event if needed
    // await runWorkflow(null, { type: "data", event: "created" }, ...)

    // ✅ Update preview store immediately if you want to reflect new thing
    // ✅ REFRESH RUNTIME DATA (same as login)
const key = `${projectSlug}_preview`;

const projectRes = await fetch(
  `${BACKEND_URL}/api/generate/projects/runtime/${projectSlug}/`,
  {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }
);

const projectData = await projectRes.json();

// ✅ Update preview store
usePreviewStore.setState({
  dbdata: projectData.db_list_data || {},
  dynamicValue: projectData.dynamic_value || {},
  appdata: {
    ...projectData.appdata,
    loggedInUser: store.currentUser?.[key] || null,
  },
});

// ✅ Persist for refresh safety
localStorage.setItem(
  `dbdata_${key}`,
  JSON.stringify(projectData.db_list_data || {})
);
localStorage.setItem(
  `dynamicValue_${key}`,
  JSON.stringify(projectData.dynamic_value || {})
);

  } catch (err) {
    console.error("Error creating thing:", err);
    alert("Create failed due to network error");
  }

  break;
}


case "show": {
  console.log("👉 SHOW ACTION TRIGGERED", action);

  const targetId = action.targetElementId;
  if (!targetId) break;

  const runtimeTree = usePreviewStore.getState().runtimeTree;

  const newPages = runtimeTree.pages.map(page =>
    toggleElementVisibility([page], targetId, false)[0]
  );

  const newGlobalPopups = toggleElementVisibility(
    runtimeTree.globalPopups?.children || [],
    targetId,
    false
  );

  usePreviewStore.setState({
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
  const runtimeTree = usePreviewStore.getState().runtimeTree;

  const newPages = runtimeTree.pages.map(page =>
    toggleElementVisibility([page], action.targetElementId, true)[0]
  );

  const newGlobalPopups = toggleElementVisibility(
    runtimeTree.globalPopups?.children || [],
    action.targetElementId,
    true
  );

  usePreviewStore.setState({
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
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-update/?version_type=preview`,
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
  const store = usePreviewStore.getState();
  usePreviewStore.setState({
    appdata: {
      ...store.appdata,
      loggedInUser: data.user,
    },
  });

  // ✅ Close popup
  usePreviewStore.setState({ openPopupId: null });

  break;
}


case "update_user_credentials": {
  console.log("🔐 UPDATE USER CREDENTIALS");

  const store = usePreviewStore.getState();
  const key = `${projectSlug}_preview`;
if (!store.currentUser?.[key]) {
  alert("Login required");
  return;
}


  const payload = {
    email: document.getElementById(String(action.email?.source))?.value || "",
    oldPassword:
      document.getElementById(String(action.oldPassword?.source))?.value || "",
    password:
      document.getElementById(String(action.password?.source))?.value || "",
    confirmPassword:
      document.getElementById(String(action.confirmPassword?.source))?.value || "",
  };

  // validations stay same...

  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-credentials-update/?version_type=preview`,
    {
      method: "PATCH",
      credentials: "include", // cookie still sent, but backend will ignore
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (data.status !== "success") {
    alert(data.message || "Credential update failed");
    return;
  }

  usePreviewStore.setState({
    appdata: {
      ...store.appdata,
      loggedInUser: data.user,
    },
  });

  usePreviewStore.setState({ openPopupId: null });
  break;
}



case "logout": {
  const key = `${projectSlug}_preview`;

  console.log("LOGOUT ACTION:", action);

  // 1️⃣ Backend logout
  await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/logout/?version_type=preview`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  // 2️⃣ Clear zustand (scoped)
  usePreviewStore.setState((state) => ({
    sessionId: {
      ...state.sessionId,
      [key]: null,
    },
    currentUser: {
      ...state.currentUser,
      [key]: null,
    },
    appdata: {
      ...state.appdata,
      loggedInUser: null,
    },
  }));

  // 3️⃣ Clear localStorage (scoped)
  localStorage.removeItem(`currentUser_${key}`);
  localStorage.removeItem(`dbdata_${key}`);
  localStorage.removeItem(`dynamicValue_${key}`);


  break;
}
 

case "signup": {
  const email = document.getElementById(String(action.email?.source))?.value || "";
  const password = document.getElementById(String(action.password?.source))?.value || "";
  const confirmPassword =
    document.getElementById(String(action.confirmPassword?.source))?.value || "";

  if (!email || !password) {
    usePreviewStore.getState().setAuthError("Email and password are required");
    return;
  }

  if (password !== confirmPassword) {
    usePreviewStore.getState().setAuthError("Passwords do not match");
    return;
  }

  const response = await fetch(
    `${BACKEND_URL}/api/secondary_user/projects/${projectSlug}/pcl-user-signup/?version_type=preview`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await response.json();
  if (data.status !== "success") {
    usePreviewStore.getState().setAuthError(data.message || "Signup failed");
    return;
  }

  usePreviewStore.setState({ openPopupId: null });

  const key = `${projectSlug}_preview`;

  usePreviewStore.getState().setSession(
    data.user,
    data.sessionId,
    projectSlug
  );

  usePreviewStore.getState().setCurrentUser(data.user, key);

  // Fetch latest project data
  const projectRes = await fetch(
    `${BACKEND_URL}/api/generate/projects/runtime/${projectSlug}/`,
    {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    }
  );
  const projectData = await projectRes.json();

  usePreviewStore.setState({
    dbdata: projectData.db_list_data || {},
    dynamicValue: projectData.dynamic_value || {},
    appdata: {
  ...projectData.appdata,
  loggedInUser: data.user,
  sessionId: data.sessionId, // <-- use this
},

  });

localStorage.setItem(`dbdata_${key}`, JSON.stringify(projectData.db_list_data || {}));
localStorage.setItem(`dynamicValue_${key}`, JSON.stringify(projectData.dynamic_value || {}));


  const dashboard =
    action.targetPageId !== undefined
      ? allPages.find((p) => String(p.id) === String(action.targetPageId))
      : allPages.find((p) => p.name.toLowerCase() === action.targetPage?.toLowerCase());

  await runWorkflow(
    null,
    { type: "general", event: "user_signed_up" },
    usePreviewStore.getState().workflows,
    usePreviewStore.getState().runtimeTree.pages,
    setCurrentPage,
    usePreviewStore.getState().appdata,
    navigate,
    projectSlug
  );

  if (dashboard) {
    setCurrentPage(dashboard.id);
navigate(previewPath(dashboard.name));

  }

  break;
}

      /* 🧭 NAVIGATION */
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
          console.warn("❌ Target page not found");
          break;
        }

navigate(previewPath(targetPage.name));
        break;
      }
 
      case "open_popup": {
  const popupId = action.popupId;
  if (!popupId) break;

  // Set popup open state in runtime store
  usePreviewStore.setState({ openPopupId: popupId });
  break;
}

case "close_popup": {
  const popupId = action.popupId;
  if (!popupId) break;

  // Only close if the popup is currently open
  const currentOpen = usePreviewStore.getState().openPopupId;
  if (currentOpen === popupId) {
    usePreviewStore.setState({ openPopupId: null });
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
