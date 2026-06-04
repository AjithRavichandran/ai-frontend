// src/CanvasRoot.js
import React, { useState, useEffect } from "react";
import CanvasNavbar from "./Canvasnavbar/CanvasNavbar";
import CanvasLeftSidebar from "./CanvasLeftSideBar/CanvasLeftsidebar";
import CanvasRendererEditor from "./CanvasRenderer/CanvasEditorRenderer";
import CanvasPropertiesPanel from "./CanvasProperties/CanvasPropertiesPanel";
import { useCanvasStore } from "./CanvasStore";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../authStore"; // adjust path
import DataTypesPanel from "./CanvasLeftSideBar/CanvasdataTypes";
import Workflows from "./CanvasLeftSideBar/CanvasWorkFlow/CanvasworkFlows";
import { findNodeAndParent } from "./utils/CanvastreeUtils";
import useCanvasDragDrop from "./CanvasDragDrop";
import useCanvasUndoRedo from "./Canvasnavbar/CanvasUndoRedo";
import CanvasPageElements from "./CanvasLeftSideBar/CanvasPageElements";// make sure the path is correct
import { placeElement } from "./CanvasLeftSideBar/CanvasAddElement";
import { buildElementsMap } from "./utils/CanvastreeUtils";
import { BACKEND_URL } from "../config";

export default function CanvasRoot() {
  const { projectSlug } = useParams();  // correct for editor
 // project ID from route

  // ------------------- Global State (Zustand) -------------------
  const {tree,setTree,loadFromBackend,activePageId,selectedElementId,zoom,setActivePageId,setSelectedElementId,setZoom,updateElementProperty,updateElementStyle,
} = useCanvasStore();

  // local state
const [hasChanges, setHasChanges] = useState(false);
const [pendingElementType, setPendingElementType] = useState(null);
const [isInitialLoad, setIsInitialLoad] = useState(true);
const pageElementRef = React.useRef(null);
useEffect(() => {
    document.title = "Editor | PCL Infotech";
  }, []);
  
// 🟣 Pages undo
const pagesUndo = useCanvasUndoRedo();
const workflowsUndo = useCanvasUndoRedo();
const pageHistory = activePageId
  ? pagesUndo.getPageHistory(activePageId)
  : [];
const pageFuture = activePageId
  ? pagesUndo.getPageFuture(activePageId)
  : [];
const canvasRef = React.useRef(null);
const propertiesPanelRef = React.useRef(null);



const { onDragStart, onDragOver, onDrop, dropIndicator, highlightedContainerId } =
useCanvasDragDrop(
  pagesUndo.pushToHistory,
  activePageId,
  setHasChanges,
   null,
  canvasRef
);



const elementsMap = React.useMemo(() => buildElementsMap(tree), [tree]);

  // ------------------- Local UI State Only -------------------
  const [expandedSections, setExpandedSections] = useState({
    pages: true,
    main: false,
    footer: false,
  });

  const [viewMode, setViewMode] = useState("pages"); // "pages" | "datatypes" | "workflows"

  const [activeScreen, setActiveScreen] = useState("LG"); // LG / MD / SM

  // inside CanvasEditor component
const datatypes = useCanvasStore((state) => state.datatypes);
const setDatatypes = useCanvasStore((state) => state.setDatatypes);

const appdata = useCanvasStore((state) => state.appdata);
const setAppdata = useCanvasStore((state) => state.setAppdata);

const liveappdata = useCanvasStore((state) => state.liveappdata);
const setLiveAppdata = useCanvasStore((state) => state.setLiveAppdata);

const workflowsStore = useCanvasStore((state) => state.workflows);
const setWorkflowsStore = useCanvasStore((state) => state.setWorkflows);

const [selectedDatatype, setSelectedDatatype] = React.useState(null); // selected one

const handleDeleteSelected = () => {
  if (!selectedElementId) return;

  if (selectedElementId === activePageId) return;
  // Save undo snapshot
  pagesUndo.pushToHistory(structuredClone(tree), activePageId);

  const newTree = structuredClone(tree);

  const deleteFromPage = (node) => {
    if (!node.children) return;

    node.children = node.children.filter((child) => {
      if (child.id === selectedElementId) return false;
      deleteFromPage(child);
      return true;
    });
  };

  const activePage = newTree.pages.find((p) => p.id === activePageId);
  if (activePage) {
    deleteFromPage(activePage);
  }

  setTree(newTree);
  setSelectedElementId(null);
  setHasChanges(true);
};
useEffect(() => {
  const handleKeyDown = (e) => {
    // Avoid delete while typing inside input fields
    const tag = e.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable) {
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      handleDeleteSelected();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedElementId, tree, activePageId]);


const handleImageUpload = (elementId, file, url = null) => {
  if (!elementId || (!file && !url)) return;

  pagesUndo.pushToHistory(structuredClone(tree), activePageId);

  let imageUrl = url;
  if (file) {
    imageUrl = URL.createObjectURL(file);
    updateElementProperty(elementId, "imageFile", file);
  }

  updateElementProperty(elementId, "imageUrl", imageUrl);
  updateElementProperty(elementId, "src", imageUrl);  // ✅ This is correct
  setHasChanges(true);
};


const handleUpdateElementProperty = (elementId, field, value) => {
  pagesUndo.pushToHistory(structuredClone(tree), activePageId);
  updateElementProperty(elementId, field, value);
  setHasChanges(true);
};



const handleUpdateElementStyle = (elementId, key, value) => {
  pagesUndo.pushToHistory(structuredClone(tree), activePageId);
  updateElementStyle(elementId, { [key]: value });
  setHasChanges(true);
};


const [activeDataTab, setActiveDataTab] = useState("datatypes"); // default tab

const [showLayersPanel, setShowLayersPanel] = useState(false);
const [layersPanelPosition, setLayersPanelPosition] = useState({ x: 900, y: 120 });

const renamePage = (pageId, newName) => {
  if (!tree?.pages?.length) return;

  setTree((prevTree) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return prevTree;

    const newPages = prevTree.pages.map((p) =>
      p.id === pageId ? { ...p, name: trimmedName } : p
    );

    return { ...prevTree, pages: newPages };
  });

  setHasChanges(true);
};

// ------------------- Save All Handler -------------------
const handleSaveAll = async () => {
  const success = await useCanvasStore.getState().saveToBackend();
  if (success) {
    setHasChanges(false);
    console.log("Saved successfully!");
  } else {
    console.error("Save failed!");
  }
};

  // ------------------- Fetch Project Schema -------------------
  useEffect(() => {
  const fetchSchema = async () => {
    try {
      const accessToken = useAuthStore.getState().accessToken;

      const res = await fetch(
        `${BACKEND_URL}/api/generate/projects/editor/${projectSlug}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401) {
        console.warn("Unauthorized! Token may be expired");
        return;
      }

      const data = await res.json();

      const normalizeImages = (node) => {
  if (!node) return;

  if (node.type === "image" && node.src && !node.imageUrl) {
    node.imageUrl = node.src;
  }

  if (node.children) {
    node.children.forEach(normalizeImages);
  }
};

data.pages?.forEach(page => normalizeImages(page));

      // Assign unique IDs for datatypes
if (data?.datatypes?.length) {
  data.datatypes = data.datatypes.map((dt) => ({
    ...dt,
    id: crypto.randomUUID(),
    fields: dt.fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
  }));
}
      loadFromBackend(data);
      // ✅ Ensure activePageId is set
if (data?.pages?.length) {
  setActivePageId(data.pages[0].id);
}

      setIsInitialLoad(false);
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  fetchSchema();
}, [projectSlug, loadFromBackend]);

useEffect(() => {
  const handleClickOutside = (e) => {
    if (!selectedElementId) return;

    const clickedInsideCanvas =
      canvasRef.current && canvasRef.current.contains(e.target);

    const clickedInsidePanel =
      propertiesPanelRef.current &&
      propertiesPanelRef.current.contains(e.target);

    if (!clickedInsideCanvas && !clickedInsidePanel) {
      setSelectedElementId(null); // 🔥 unselect element
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () =>
    document.removeEventListener("mousedown", handleClickOutside);
}, [selectedElementId]);

// If data isn't loaded yet, avoid errors
if (!tree || !tree.pages || tree.pages.length === 0) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-4">
      {/* Spinner */}
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>

      {/* Loading Text */}
      <h2 className="text-xl font-semibold mb-2">Loading your project...</h2>
      <p className="text-center text-gray-500 max-w-sm mb-4">
        Please wait a moment while we fetch your project data.
      </p>

     {/* Refresh Tip */}
<div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded max-w-sm text-sm shadow-sm">
  <p className="font-semibold mb-2 flex items-center justify-center">
    ⚠️ You might see this issue
  </p>

  <ul className="list-decimal list-inside text-left mb-2 space-y-1">
    <li>While <span className="font-semibold">renaming a page</span></li>
    <li>While <span className="font-semibold">creating a new page</span></li>
    <li>While <span className="font-semibold">deleting a page</span></li>
  </ul>

  <p className="text-center">
    Refreshing the page (<span className="font-semibold">F5</span>) usually fixes it.
  </p>
</div>



    </div>
  );
}

const activePage =
  tree.pages.find((p) => p.id === activePageId) || tree.pages[0];

const showCanvas = viewMode === "pages";

// ------------------- Helper Functions -------------------
const selectedElement = selectedElementId
  ? findNodeAndParent(tree, selectedElementId)?.node
  : null;
  const onDragLeaveCanvas = () => {
  };

const handlers = {
  onDragStart,
  onDragOver,
  onDrop,

  onToggleVisibility: (elementId) => {
    pagesUndo.pushToHistory(structuredClone(tree), activePageId);

    let result = findNodeAndParent(tree, elementId);

    if (!result?.node && tree.globalPopups?.children) {
      const popup = tree.globalPopups.children.find((p) => p.id === elementId);
      if (popup) result = { node: popup, parent: tree.globalPopups };
    }

    if (!result?.node) return;

    const el = result.node;

    if (el.type === "popup" || el.type === "modal") {
      updateElementProperty(elementId, "isOpen", !el.isOpen);
    } else {
      updateElementProperty(elementId, "hidden", !el.hidden);
    }

    setHasChanges(true);
  },
};


const updateWorkflows = (newWorkflows) => {
  workflowsUndo.pushToHistory(structuredClone(workflowsStore), "workflows");
  setWorkflowsStore(newWorkflows);
  setHasChanges(true);
};


const handleTogglePopup = (popupId) => {
    pagesUndo.pushToHistory(structuredClone(tree), activePageId);

    setTree((prevTree) => {
      const newTree = structuredClone(prevTree);
      const popup = findNodeAndParent(newTree, popupId)?.node;
      if (!popup) return prevTree;

      popup.isOpen = !popup.isOpen; // toggle open/close

      // Optional: close other popups
      newTree.globalPopups.children.forEach((p) => {
        if (p.id !== popupId && (p.type === "popup" || p.type === "modal")) {
          p.isOpen = false;
        }
      });

      return newTree;
    });
  };
  // ------------------- UI -------------------
  return (
  <div
    className="w-full h-screen overflow-hidden bg-gray-50"
    onDragLeave={onDragLeaveCanvas}
  >
    <CanvasNavbar
    projectSlug={projectSlug}
  viewMode={viewMode}
  firstPage={tree.pages[0]}
  onUndoPages={() =>
    pagesUndo.handleUndo(activePageId, tree, setTree, setHasChanges)
  }
  onRedoPages={() =>
    pagesUndo.handleRedo(activePageId, tree, setTree, setHasChanges)
  }
  canUndoPages={pageHistory.length > 0}
  canRedoPages={pageFuture.length > 0}

  onUndoWorkflows={() =>
    workflowsUndo.handleUndo(
      "workflows",
      workflowsStore,
      setWorkflowsStore,
      setHasChanges
    )
  }
  onRedoWorkflows={() =>
    workflowsUndo.handleRedo(
      "workflows",
      workflowsStore,
      setWorkflowsStore,
      setHasChanges
    )
  }
  canUndoWorkflows={
    workflowsUndo.getPageHistory("workflows").length > 0
  }
  canRedoWorkflows={
    workflowsUndo.getPageFuture("workflows").length > 0
  }

  onSaveAll={handleSaveAll}
  hasChanges={hasChanges}
  zoom={zoom}
  setZoom={setZoom}
/>

  <div className="flex w-full h-full pt-14">
      {/* LEFT SIDEBAR */}
      <CanvasLeftSidebar
        expandedSections={expandedSections}
        toggleSection={(key) =>
          setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        pages={tree.pages}
        activePageId={activePageId}
        setActivePageId={setActivePageId}
        setTree={setTree}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setShowLayersPanel={setShowLayersPanel}
        renamePage={renamePage}
        setHasChanges={setHasChanges}
       addElement={(type) => {
  const result = placeElement({
    type,
    tree,
    setTree,
    activePageId,
    selectedElementId,
    pushToHistory: pagesUndo.pushToHistory,
    setHasChanges,
  });

  if (!result) return;

  const { insertParent, newElement } = result;

  // 🔒 Keep parent selected
  if (insertParent?.id) {
    setSelectedElementId(insertParent.id);
  }

  // 🟣 Optional: auto-select popup itself
  if (newElement?.type === "popup") {
    setSelectedElementId(newElement.id);
  }
}}
/>

{/* ORDER PANEL — DOCKED */}
  {showLayersPanel && viewMode === "pages" && activePage && (
    <CanvasPageElements
      ref={pageElementRef}
      activePageChildren={activePage.children || []}
      handlers={handlers}
      selectedElementId={selectedElementId}
      setSelectedElementId={setSelectedElementId}

      tree={tree}    
      elementsMap={elementsMap}// pass the tree
    />
  )}
  
{/* MAIN CONTENT */}
<div className="flex-1 flex flex-col overflow-auto bg-[#e5e7eb] p-6">  {viewMode === "pages" ? (
    <div
    ref={canvasRef}
  style={{
    width: 1400,
    height: "auto",
    backgroundColor: activePage.backgroundColor || "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 0 12px rgba(0,0,0,0.1)",
    overflow: "auto",
    transform: `scale(${zoom / 100})`,
    transformOrigin: "top center",
  }}
  onClick={(e) => {
    if (!pendingElementType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (zoom / 100);
    const y = (e.clientY - rect.top) / (zoom / 100);

    placeElement({type: pendingElementType,tree,setTree,activePageId,selectedElementId,pushToHistory: pagesUndo.pushToHistory,position: { x, y },setHasChanges,             // ✅ pass current user edit permission
 });

    setPendingElementType(null); // reset pending
  }}
>


      {/* Page children */}
{(activePage.children || []).map((element, index) => (
  <CanvasRendererEditor
    key={element.id}
    element={{ ...element, parentId: activePage.id, indexInParent: index }}
    handlers={handlers}
    selectedElement={selectedElement}
    dropIndicator={dropIndicator}
    highlightedContainerId={highlightedContainerId}
    onSelectElement={(el, e) => {
      e.stopPropagation();
      setSelectedElementId(el.id);
    }}
  />
))}

{/* Global popups — render only if not hidden */}
{tree.globalPopups?.children?.map(
  (popup) =>
    popup.isOpen && (
      <CanvasRendererEditor
        key={popup.id}
        element={popup}
        handlers={handlers}
        selectedElement={selectedElement}
        dropIndicator={dropIndicator}
        highlightedContainerId={highlightedContainerId}
        onSelectElement={(el) => setSelectedElementId(el.id)}
        skipWrapper={true}
      />
    )
)}

    </div>
    
  ) : viewMode === "datatypes" ? (
  <div className="flex flex-col h-full">
    {/* Tab Buttons */}
    <div className="flex border-b border-gray-300 bg-gray-50">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeDataTab === "datatypes"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-600"
        }`}
        onClick={() => {
          setActiveDataTab("datatypes");
          setSelectedDatatype(null);
        }}
      >
        Datatypes
      </button>

      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeDataTab === "appdata"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-600"
        }`}
        onClick={() => {
          setActiveDataTab("appdata");
          setSelectedDatatype(null);
        }}
      >
        App Data
      </button>

      <button
  className={`px-4 py-2 text-sm font-medium ${
    activeDataTab === "privacy"
      ? "border-b-2 border-blue-500 text-blue-600"
      : "text-gray-600"
  }`}
  onClick={() => setActiveDataTab("privacy")} // don't reset selectedDatatype
>
  Privacy
</button>

    </div>

   <div className="flex-1 overflow-auto p-4">
  {activeDataTab === "appdata" ? (
    <DataTypesPanel
      datatypes={appdata}
      schema={datatypes}  
      setDatatypes={(newData) => {
        setAppdata(newData);
        setHasChanges(true);
      }}
      selectedDatatype={selectedDatatype}
      setSelectedDatatype={setSelectedDatatype}
      type="appdata"

    />
  ) : activeDataTab === "privacy" ? (
    <DataTypesPanel
      datatypes={datatypes}
      setDatatypes={(newData) => {
        setDatatypes(newData);
        setHasChanges(true);
      }}
      selectedDatatype={selectedDatatype}
      setSelectedDatatype={setSelectedDatatype}
      type="privacy"
    />
  ) : (
    <DataTypesPanel
  datatypes={datatypes}
  setDatatypes={(newData) => {
    setDatatypes(newData);
    setHasChanges(true);
  }}
  appdata={appdata}
  setAppdata={setAppdata}
  selectedDatatype={selectedDatatype}
  setSelectedDatatype={setSelectedDatatype}
  type="datatypes"
/>

  )}
</div>
  </div>
) : viewMode === "workflows" && (
  <Workflows 
  workflows={workflowsStore || []}
  setWorkflows={updateWorkflows}
  pages={tree?.pages || []}
  tree={tree}
    datatypes={datatypes}  
/>
)}
      </div>
      {/* RIGHT PROPERTIES PANEL — FIXED */}
<div
  className={`transition-all duration-200 bg-white border-l border-gray-200 shadow-sm
    overflow-hidden flex-shrink-0
    ${selectedElement ? "w-[300px]" : "w-0"}
  `}
>

  {selectedElement && (
    <div
      ref={propertiesPanelRef}
      className="h-full overflow-y-auto"
    >
      <CanvasPropertiesPanel
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        selectedElement={selectedElement}
        updateElementProperty={handleUpdateElementProperty}
        updateElementStyle={handleUpdateElementStyle}
        handleImageUpload={handleImageUpload}
        appdata={appdata}
        datatypes={datatypes}
        canvasTree={tree}
      />
    </div>
  )}
</div>

    </div>


    {/* FLOATING PROPERTY PANEL */}

  </div>
);
}
