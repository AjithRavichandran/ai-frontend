import { create } from "zustand";
import { useAuthStore } from "../authStore"; // import your auth store
import { BACKEND_URL } from "../config";

// Iterative version of findNodeAndParent to avoid recursion
export const findNodeAndParent = (root, id) => {
  if (!root) return null;

  const stack = [{ node: root, parent: null }];

  while (stack.length > 0) {
    const { node, parent } = stack.pop();

    if (node.id === id) return { node, parent };

    if (node.pages) {
      for (const page of node.pages) {
        stack.push({ node: page, parent: node });
      }
    }

    const children = node.children || [];
    for (const child of children) {
      stack.push({ node: child, parent: node });
    }
  }

  return null;
};

export const useCanvasStore = create((set, get) => ({
  projectId: null,
  projectName: "",
  tree: null,
  workflows: [],
  datatypes: [],
  appdata: {},
  liveappdata: {},
  tableRenames: {},    // { oldName: newName }
fieldRenames: {},    // { tableName: { oldField: newField } }

setDatatypes: (newDatatypes) =>
  set(() => ({
    datatypes: structuredClone(newDatatypes),
  })),

setAppdata: (newAppdata) =>
  set(() => ({
    appdata: structuredClone(newAppdata),
  })),

  setLiveAppdata: (newLiveAppdata) =>
  set(() => ({
    liveappdata: structuredClone(newLiveAppdata),
  })),

setWorkflows: (newWorkflows) =>
  set(() => ({
    workflows: structuredClone(newWorkflows),
  })),

setTableRenames: (newRenames) =>
  set((state) => {
    const merged = { ...state.tableRenames };

    Object.entries(newRenames).forEach(([oldName, newName]) => {
      // If oldName was already a rename target, collapse chain
      for (const original in merged) {
        if (merged[original] === oldName) {
          merged[original] = newName;
          return;
        }
      }

      merged[oldName] = newName;
    });

    return { tableRenames: merged };
  }),

setFieldRenames: (newRenames) =>
  set((state) => {
    const merged = structuredClone(state.fieldRenames);

    Object.entries(newRenames).forEach(([tableName, fieldMap]) => {
      if (!merged[tableName]) merged[tableName] = {};

      Object.entries(fieldMap).forEach(([oldField, newField]) => {
        // Collapse field rename chains
        for (const original in merged[tableName]) {
          if (merged[tableName][original] === oldField) {
            merged[tableName][original] = newField;
            return;
          }
        }

        merged[tableName][oldField] = newField;
      });
    });

    return { fieldRenames: merged };
  }),
clearRenames: () =>
  set({
    tableRenames: {},
    fieldRenames: {},
  }),


  hasUnsavedChanges: () => {
    const tableChanged = Object.keys(get().tableRenames || {}).length > 0;
    const fieldsChanged = Object.values(get().fieldRenames || {}).some(
      tbl => Object.keys(tbl).length > 0
    );
    return tableChanged || fieldsChanged;
  },
activePageId: null,
  selectedElementId: null,
  zoom: 100,
  // ------------------- PREVIEW LOADER -------------------
  loadingPreview: false,

  setLoadingPreview: (value) =>
    set(() => ({
      loadingPreview: value,
    })),

  // ------------------- LOAD FROM BACKEND -------------------
  loadFromBackend: (data) => {
    console.log("RAW backend workflows:", data.workflows);
  console.log(
    "Extracted workflows:",
    Array.isArray(data.workflows)
      ? data.workflows
      : data.workflows?.workflows || []
  );
    set({
      projectId: data.id,
      projectName: data.project_name,
      tree: data.schema || { pages: [] },
      workflows: Array.isArray(data.workflows)
        ? data.workflows
        : data.workflows?.workflows || [], // always flatten
datatypes: Array.isArray(data.datatypes)
  ? structuredClone(data.datatypes)
  : [],

appdata:
  data.appdata && typeof data.appdata === "object"
    ? structuredClone(data.appdata)
    : {},

    liveappdata:
      data.liveappdata && typeof data.liveappdata === "object"
        ? structuredClone(data.liveappdata)
        : {},

     activePageId:
        data.schema?.activePageId || data.schema?.pages?.[0]?.id || null,
      selectedElementId: null,
    });
  },
// CanvasStore.js
renamePage: (pageId, newName) => {
  const tree = get().tree;
  if (!tree) return;

  const res = findNodeAndParent(tree, pageId);
  if (!res?.node) return;

  res.node.name = newName;  // ✅ only update the node's name

  set({ tree }); // tree reference stays mostly the same, only the node changed
},


  // ------------------- SAVE ALL TO BACKEND -------------------
  saveToBackend: async () => {
    const state = get();

    if (!state.projectId || !state.tree) {
      console.warn("Cannot save: projectId or tree is missing");
      return false;
    }

    try {
      const token = useAuthStore.getState().accessToken;
      const url = `${BACKEND_URL}/api/generate/projects/${state.projectId}/save_all/`;

      const payload = {
        schema: state.tree,
        workflows: Array.isArray(state.workflows) ? state.workflows : [],
        datatypes: Array.isArray(state.datatypes) ? state.datatypes : [],
        appdata:
          state.appdata && typeof state.appdata === "object" ? state.appdata : {},
      };

      console.log("Saving payload:", payload);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed: ${res.status} ${text}`);
      }

      console.log("Saved successfully!");
      return true;
    } catch (err) {
      console.error("SaveAll error:", err);
      return false;
    }
  },

  saveLiveToBackend: async () => {
  const state = get();
  if (!state.projectId) return false;

  const token = useAuthStore.getState().accessToken;

  const payload = {
    liveappdata: state.liveappdata, // 👈 LIVE ONLY
  };

  const res = await fetch(
    `${BACKEND_URL}/api/generate/projects/${state.projectId}/save/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  return res.ok;
},

saveLiveTableandFieldNameToBackend: async () => {
  const state = get();
  const token = useAuthStore.getState().accessToken;

  const payload = {
    table_renames: state.tableRenames,
    field_renames: state.fieldRenames,
  };

  const res = await fetch(
    `${BACKEND_URL}/api/generate/projects/${state.projectId}/replace-schema/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  return res.ok;
},

  // ------------------- BASIC SETTERS -------------------
  setTree: (newTree) => set({ tree: newTree, selectedElementId: null }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),
  setActivePageId: (id) => {
    const tree = structuredClone(get().tree);
    tree.activePageId = id;
    set({ activePageId: id, tree });
  },
  setZoom: (z) => set({ zoom: Math.max(10, Math.min(z, 500)) }),
setProjectName: (name) =>
  set(() => ({
    projectName: name,
  })),

  // ------------------- UPDATE ELEMENT PROPERTY -------------------
 updateElementProperty: (elementId, field, value) => {
  const tree = structuredClone(get().tree);
  const res = findNodeAndParent(tree, elementId);

  if (!res?.node) return;

  // -------------------------------
  // SPECIAL HANDLING FOR DATASOURCE
  // -------------------------------
  if (field === "dataSource") {
    // always ensure an independent object (prevent shared ref bug)
    const existing =
      res.node.dataSource && typeof res.node.dataSource === "object"
        ? structuredClone(res.node.dataSource)
        : {
            type: "",
            mode: "",
            fields: [],
            constraints: [],
            sort: null,
            limit: null,
          };

    // CASE 1: user selected datatype
    if (typeof value === "string") {
      existing.type = value; // keep all other fields intact
    }

    // CASE 2: user updated mode/constraints/fields
    else if (typeof value === "object") {
      Object.assign(existing, value); // deep merge
    }

    res.node.dataSource = existing;
  }

  // -------------------------------
  // NORMAL PROPERTY UPDATE
  // -------------------------------
  else {
    res.node[field] = value;
  }

  set({ tree, selectedElementId: elementId });
},


  // ------------------- UPDATE ELEMENT STYLE -------------------
  updateElementStyle: (elementId, updates) => {
    const tree = structuredClone(get().tree);
    const res = findNodeAndParent(tree, elementId);

    if (res?.node) {
      if (!res.node.style) res.node.style = {};
      res.node.style = { ...res.node.style, ...updates };
    }

    set({ tree, selectedElementId: elementId });
  },
}));
