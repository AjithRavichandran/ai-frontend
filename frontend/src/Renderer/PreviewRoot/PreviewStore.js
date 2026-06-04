// PreviewStore.js
import { create } from "zustand";

export const usePreviewStore = create((set, get) => ({
  // ----------------------------
  // Runtime data
  // ----------------------------
  runtimeTree: null,
  workflows: [],
  datatypes: [],
  appdata: {},
  dbdata: {},
  dynamicValue: {},
  activePageId: null,

  // ----------------------------
  // Auth / Session (project-scoped)
  // ----------------------------
  loggedInUser: {},    // { [projectSlug]: user }
  currentUser: {},     // { [projectSlug]: user }
  sessionId: {},       // { [projectSlug]: sessionId }
  isSessionHydrated: false,

  // ----------------------------
  // UI / Popup
  // ----------------------------
  openPopupId: null,
  authError: null,
  openPopup: (popupId) => set({ openPopupId: popupId, authError: null }),
  closePopup: () => set({ openPopupId: null, authError: null }),

  setAuthError: (message) => set({ authError: message }),
  clearAuthError: () => set({ authError: null }),

  setCurrentUser: (user, projectSlug) =>
    set((state) => ({
      currentUser: { ...state.currentUser, [projectSlug]: user },
    })),
  clearCurrentUser: (projectSlug) =>
    set((state) => ({
      currentUser: { ...state.currentUser, [projectSlug]: null },
    })),

  // ----------------------------
  // Save runtime data
  // ----------------------------
  saveRuntimeData: (data) => {
    const schema = data.schema || {};
    let workflows = data.workflows || [];

    if (Array.isArray(workflows) && workflows.length === 1 && workflows[0]?.workflows) {
      workflows = workflows[0].workflows;
    }

    set({
      runtimeTree: schema,
      workflows: Array.isArray(workflows) ? workflows : [],
      datatypes: data.datatypes || [],
      appdata: data.appdata || {},
      dbdata: data.dbdata || {},
      dynamicValue: data.dynamicValue || {},
    });

    console.log("🟦 Runtime data saved");
  },

  // ----------------------------
  // Element value mutation
  // ----------------------------
  setElementValue: (elementId, value) =>
  set((state) => {
    if (!state.runtimeTree) return {};

    const elementKey = String(elementId); // for element comparison
    const updateNodes = (nodes = []) =>
      nodes.map((node) => {
        if (String(node.id) === elementKey) return { ...node, value };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });

    const storageKey = `${state.appdata?.projectSlug || "global"}_preview`; // for storage
    const newDynamicValue = { ...state.dynamicValue, [elementKey]: value };

    localStorage.setItem(`dynamicValue_${storageKey}`, JSON.stringify(newDynamicValue));

    return {
      runtimeTree: {
        ...state.runtimeTree,
        pages: updateNodes(state.runtimeTree.pages),
        globalPopups: state.runtimeTree.globalPopups
          ? { ...state.runtimeTree.globalPopups, children: updateNodes(state.runtimeTree.globalPopups.children) }
          : state.runtimeTree.globalPopups,
      },
      dynamicValue: newDynamicValue,
    };
  }),

  // ----------------------------
  // Session management
  // ----------------------------
setSession: (user, sessionId, projectSlug) => {
  const version = "preview";
  const sessionKey = `${projectSlug}_${version}`;
  const cookieName = `sessionId_${projectSlug}_${version}`;

  localStorage.setItem(`sessionId_${sessionKey}`, sessionId);
  localStorage.setItem(`currentUser_${sessionKey}`, JSON.stringify(user));

  set((state) => ({
    loggedInUser: { ...state.loggedInUser, [sessionKey]: user },
    currentUser: { ...state.currentUser, [sessionKey]: user },
    sessionId: { ...state.sessionId, [sessionKey]: sessionId },
  }));
},



 clearSession: (projectSlug) => {
  const version = "preview";
  const sessionKey = `${projectSlug}_${version}`;
  const cookieName = `sessionId_${projectSlug}_${version}`;

  document.cookie = `${cookieName}=; path=/; max-age=0`;
  localStorage.removeItem(`sessionId_${sessionKey}`);
  localStorage.removeItem(`currentUser_${sessionKey}`);
  localStorage.removeItem(`dbdata_${sessionKey}`);
  localStorage.removeItem(`dynamicValue_${sessionKey}`);

  set((state) => ({
    loggedInUser: { ...state.loggedInUser, [sessionKey]: null },
    currentUser: { ...state.currentUser, [sessionKey]: null },
    sessionId: { ...state.sessionId, [sessionKey]: null },
    dbdata: { ...state.dbdata, [sessionKey]: {} },
    dynamicValue: { ...state.dynamicValue, [sessionKey]: {} },
    isSessionHydrated: false,
  }));
},

  // ----------------------------
  // Hydrate session from cookie/localStorage
  // ----------------------------
hydrateSessionFromCookie: (projectSlug) => {
  const version = "preview";
  const sessionKey = `${projectSlug}_${version}`;
  const cookieName = `sessionId_${projectSlug}_${version}`;

  const sessionId =
    document.cookie.match(new RegExp(`${cookieName}=([^;]+)`))?.[1] ||
    localStorage.getItem(`sessionId_${sessionKey}`);

  const dbdata = JSON.parse(
    localStorage.getItem(`dbdata_${sessionKey}`) || "{}"
  );

  const dynamicValue = JSON.parse(
    localStorage.getItem(`dynamicValue_${sessionKey}`) || "{}"
  );

  set((state) => ({
    sessionId: { ...state.sessionId, [sessionKey]: sessionId || null },
    currentUser: { ...state.currentUser, [sessionKey]: null }, // ❌ fix here
    loggedInUser: { ...state.loggedInUser, [sessionKey]: null }, // ❌ fix here
    dbdata: { ...state.dbdata, [sessionKey]: dbdata },
    dynamicValue: { ...state.dynamicValue, [sessionKey]: dynamicValue },
    isSessionHydrated: true,
  }));

  console.log(`🟡 [PREVIEW ${projectSlug}] session hydrated`, {
    sessionId,
  });
},



  // ----------------------------
  // Page management
  // ----------------------------
  setActivePage: (id, options = { pushHistory: false, slug: null, projectSlug: null, navigate: null }) => {
    set({ activePageId: id });

    const { pushHistory, slug, projectSlug, navigate } = options;
    if (pushHistory && navigate && slug && projectSlug) {
      navigate(`/runtime/${projectSlug}/${slug}`, { replace: false });
    }
  },

  // ----------------------------
  // Clear everything
  // ----------------------------
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
