import { create } from "zustand";

export const useLiveStore = create((set, get) => ({
  // ============================
  // Runtime data
  // ============================
  runtimeTree: null,
  workflows: [],
  datatypes: [],
  appdata: {},
  dbdata: {},
  dynamicValue: {},
  activePageId: null,

  // ============================
  // Auth / Session (project-scoped, LIVE)
  // ============================
  loggedInUser: {},   // { [projectSlug]: user }
  currentUser: {},    // { [projectSlug]: user }
  sessionId: {},      // { [projectSlug]: sessionId }
  isSessionHydrated: false,

  // ============================
  // UI / Popup
  // ============================
  openPopupId: null,
  authError: null,

  openPopup: (popupId) =>
    set({ openPopupId: popupId, authError: null }),

  closePopup: () =>
    set({ openPopupId: null, authError: null }),

  setAuthError: (message) =>
    set({ authError: message }),

  clearAuthError: () =>
    set({ authError: null }),

  // ============================
  // Current user helpers
  // ============================
setCurrentUser: (user, projectSlug) => {
  const key = `${projectSlug}_live`;
  set((state) => ({
    currentUser: { ...state.currentUser, [key]: user },
  }));
},

clearCurrentUser: (projectSlug) => {
  const key = `${projectSlug}_live`;
  set((state) => ({
    currentUser: { ...state.currentUser, [key]: null },
  }));
},


  // ============================
  // Save runtime data
  // ============================
  saveRuntimeData: (data) => {
  const schema = data.schema || {};
  let workflows = data.workflows || [];

  if (
    Array.isArray(workflows) &&
    workflows.length === 1 &&
    workflows[0]?.workflows
  ) {
    workflows = workflows[0].workflows;
  }

  const projectSlug = data.appdata?.projectSlug || "global";
  const liveKey = `${projectSlug}_live`;
  const sessionKey = `sessionId_${projectSlug}_live`;

  // 🔐 AUTH SYNC — THIS WAS MISSING
  if (!data.loggedInUser) {
    // Backend says session invalid → force logout
    localStorage.removeItem(sessionKey);
    localStorage.removeItem(`currentUser_${sessionKey}`);

    set((state) => ({
      loggedInUser: { ...state.loggedInUser, [liveKey]: null },
      currentUser: { ...state.currentUser, [liveKey]: null },
      sessionId: { ...state.sessionId, [liveKey]: null },
    }));
  } else {
    // Backend confirms user
    localStorage.setItem(
      `currentUser_${sessionKey}`,
      JSON.stringify(data.loggedInUser)
    );

    set((state) => ({
      loggedInUser: { ...state.loggedInUser, [liveKey]: data.loggedInUser },
      currentUser: { ...state.currentUser, [liveKey]: data.loggedInUser },
    }));
  }

  // Normal runtime data
  set({
    runtimeTree: schema,
    workflows: Array.isArray(workflows) ? workflows : [],
    datatypes: data.datatypes || [],
    appdata: data.appdata || {},
    dbdata: data.dbdata || {},
    dynamicValue: data.dynamicValue || {},
  });

  console.log("🟦 LIVE runtime + auth synced");
},

  // ============================
  // Element value mutation
  // ============================
  setElementValue: (elementId, value) =>
    set((state) => {
      if (!state.runtimeTree) return {};

      const key = String(elementId);

      const updateNodes = (nodes = []) =>
        nodes.map((node) => {
          if (String(node.id) === key) {
            return { ...node, value };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });

      const projectSlug = state.appdata?.projectSlug || "global";
      const storageKey = `${projectSlug}_live`;

      const newDynamicValue = {
        ...state.dynamicValue,
        [key]: value,
      };

      localStorage.setItem(
        `dynamicValue_${storageKey}`,
        JSON.stringify(newDynamicValue)
      );

      return {
        runtimeTree: {
          ...state.runtimeTree,
          pages: updateNodes(state.runtimeTree.pages),
          globalPopups: state.runtimeTree.globalPopups
            ? {
                ...state.runtimeTree.globalPopups,
                children: updateNodes(
                  state.runtimeTree.globalPopups.children
                ),
              }
            : state.runtimeTree.globalPopups,
        },
        dynamicValue: newDynamicValue,
      };
    }),

// ============================
// Session management (LIVE)
// ============================
setSession: (user, sessionId, projectSlug) => {
  const slug = projectSlug || "global";
  const versionType = "live";

  const sessionKey = `sessionId_${slug}_${versionType}`; // matches backend cookie
  const liveKey = `${slug}_live`;                        // frontend store key

  // Persist in localStorage
  localStorage.setItem(sessionKey, sessionId);
  localStorage.setItem(`currentUser_${sessionKey}`, JSON.stringify(user));

  set((state) => ({
loggedInUser: { ...state.loggedInUser, [liveKey]: user },
    currentUser: { ...state.currentUser, [liveKey]: user },
    sessionId: { ...state.sessionId, [liveKey]: sessionId },
  }));
},

hydrateSessionFromCookie: (projectSlug) => {
  const slug = projectSlug || "global";
  const versionType = "live";

  const sessionKey = `sessionId_${slug}_${versionType}`;
  const liveKey = `${slug}_live`;

  // Get sessionId from cookie or LS
  const sessionId =
    document.cookie.match(new RegExp(`${sessionKey}=([^;]+)`))?.[1] ||
    localStorage.getItem(sessionKey);

  const dbdata = JSON.parse(localStorage.getItem(`dbdata_${liveKey}`) || "{}");
  const dynamicValue = JSON.parse(
    localStorage.getItem(`dynamicValue_${liveKey}`) || "{}"
  );

  if (!sessionId) {
    // session expired or missing → clear user
    set((state) => ({
      sessionId: { ...state.sessionId, [liveKey]: null },
      currentUser: { ...state.currentUser, [liveKey]: null },
      loggedInUser: { ...state.loggedInUser, [liveKey]: null },
      dbdata,
      dynamicValue,
      isSessionHydrated: true,
    }));
    console.log(`🛑 [LIVE ${slug}] session missing → user logged out`);
    return;
  }

  // valid sessionId → restore user
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem(`currentUser_${sessionKey}`) || "null");
  } catch {
    currentUser = null;
  }

  set((state) => ({
    sessionId: { ...state.sessionId, [liveKey]: sessionId },
    currentUser: { ...state.currentUser, [liveKey]: currentUser },
    loggedInUser: { ...state.loggedInUser, [liveKey]: currentUser },
    dbdata,
    dynamicValue,
    isSessionHydrated: true,
  }));

  console.log(`🟡 [LIVE ${slug}] session hydrated`, { sessionId, currentUser });
},

clearSession: (projectSlug) => {
  const slug = projectSlug || "global";
  const versionType = "live";

  const sessionKey = `sessionId_${slug}_${versionType}`;
  const liveKey = `${slug}_live`;

  localStorage.removeItem(sessionKey);
  localStorage.removeItem(`currentUser_${sessionKey}`);
  localStorage.removeItem(`dbdata_${liveKey}`);
  localStorage.removeItem(`dynamicValue_${liveKey}`);

  set((state) => ({
    loggedInUser: { ...state.loggedInUser, [liveKey]: null },
    currentUser: { ...state.currentUser, [liveKey]: null },
    sessionId: { ...state.sessionId, [liveKey]: null },
    dbdata: {},
    dynamicValue: {},
    isSessionHydrated: false,
  }));
},

  // ============================
  // Page management
  // ============================
  setActivePage: (
    id,
    { pushHistory = false, slug, projectSlug, navigate } = {}
  ) => {
    set({ activePageId: id });

    if (pushHistory && navigate && slug && projectSlug) {
      navigate(`/${projectSlug}/${slug}`, { replace: false });
    }
  },

  // ============================
  // Clear everything
  // ============================
  clearRuntime: () =>
    set({
      runtimeTree: null,
      workflows: [],
      datatypes: [],
      appdata: {},
      dbdata: {},
      dynamicValue: {},
      activePageId: null,
      loggedInUser: {},
      currentUser: {},
      sessionId: {},
      isSessionHydrated: false,
    }),
}));
