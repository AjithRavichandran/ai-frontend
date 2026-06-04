// src/Canvas/CanvasLeftSideBar/CanvasLeftsidebar.js

import React from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2  } from "lucide-react";
import { useAuthStore } from "../../authStore"; // adjust path if needed
import { useCanvasStore } from "../CanvasStore"; // adjust path
import { BACKEND_URL } from "../../config";

const elementTypes = [
  { name: "Text", type: "text" },
  { name: "Button", type: "button" },
  { name: "Image", type: "image" },
  { name: "Input", type: "input" },
  { name: "Checkbox", type: "checkbox" },
  { name: "Radio Button", type: "radio" },
  { name: "Dropdown", type: "dropdown" },
  { name: "Date Picker", type: "datepicker" },
  { name: "Card", type: "card" },
  {name: "Row Container", type: "row-container"},
  {name: "Column Container", type: "column-container"},
  {name: "Repeating Groups", type: "repeating_group"},
  { name: "Popup", type: "popup" }
];

function SectionHeader({ title, expanded, onClick, action }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2
                 text-sm font-semibold text-gray-700
                 hover:bg-gray-100 select-none cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Left: Title */}
      <span>{title}</span>

      {/* Right: Arrow or Action */}
      {action ? (
        action.customButton ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Page
          </button>
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className="p-1 rounded hover:bg-gray-200"
          >
            {action.icon}
          </div>
        )
      ) : expanded ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronRight size={16} />
      )}
    </div>
  );
}


export default function CanvasLeftSidebar({
  toggleSection,
  expandedSections = {},
  addElement,
  pages = [],
  activePageId,
  setActivePageId,
  viewMode, 
  setViewMode,
   setShowLayersPanel,
   setTree,
  renamePage
}) {
  const handlePageClick = (e, pageId) => {
    e.stopPropagation();
    setActivePageId(pageId);
    setViewMode("pages"); // ✅ Return to page canvas
  };
const token = useAuthStore((state) => state.accessToken);
const createPageApi = async (pageName) => {
  const token = useAuthStore.getState().accessToken;
  const projectId = useCanvasStore.getState().projectId;

  const res = await fetch(
    `${BACKEND_URL}/api/generate/projects/${projectId}/pages/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: pageName,
        width: 1500,
        backgroundColor: "#ffffff",
      }),
    }
  );

  if (!res.ok) throw new Error("Failed to create page");

  return await res.json(); // ✅ backend page
};

const togglePopupVisibility = (popup) => {
  popup.isOpen = !popup.isOpen;
  popup.hidden = !popup.isOpen;
  setTree((prev) => ({ ...prev }));
};
const [searchTerm, setSearchTerm] = React.useState("");
const isSearching = searchTerm.trim().length > 0;
const [editingPageId, setEditingPageId] = React.useState(null);
const [pageNameDraft, setPageNameDraft] = React.useState("");

const [deletingPage, setDeletingPage] = React.useState(null);

const [showCreatePageModal, setShowCreatePageModal] = React.useState(false);
const [newPageName, setNewPageName] = React.useState("");
const getTabClass = (mode) =>
  `flex items-center justify-between p-3 cursor-pointer border-b border-gray-200
   transition
   ${
     viewMode === mode
       ? "bg-blue-50 text-blue-600 font-semibold border-l-4 border-blue-500"
       : "text-gray-700 hover:bg-gray-50"
   }`;
const renamePageApi = async (pageId, newName) => {
  const oldName = pages.find(p => p.id === pageId)?.name;
  renamePage(pageId, newName); // optimistic update

  try {
    const token = useAuthStore.getState().accessToken;
    const projectId = useCanvasStore.getState().projectId;

    const res = await fetch(
      `${BACKEND_URL}/api/generate/projects/${projectId}/pages/${pageId}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      }
    );

    if (!res.ok) renamePage(pageId, oldName); // rollback if failed
  } catch (err) {
    console.error(err);
    renamePage(pageId, oldName); // rollback
  }
};



  return (
    <div
      className="bg-white border-r border-gray-200 overflow-y-auto"
      style={{ width: "180px" }}
    >
<div className="bg-blue-100 text-blue-900 font-bold px-3 py-3 border-b border-blue-200 text-sm shadow-sm">
  Canvas Sidebar
</div>


      {/* 🧭 Static Sections */}
      <div
  className={getTabClass("datatypes")}
  onClick={() => setViewMode("datatypes")}
>
        <span className="text-sm font-medium">Data Types / App Data </span>
      </div>

      <div
  className={getTabClass("workflows")}
  onClick={() => setViewMode("workflows")}
>
        <span className="text-sm font-medium">Workflows</span>
      </div>

      {/* 📄 PAGES SECTION */}
      <div className="border-b border-gray-200">
        <SectionHeader
  title="Pages"
  expanded={expandedSections.pages}
  onClick={() => toggleSection("pages")}
  action={{
    onClick: () => {
      setNewPageName("");
      setShowCreatePageModal(true);
    },
    customButton: true, // flag to render a button instead of icon
  }}
/>


        {expandedSections.pages && (
          <div className="pl-4 space-y-1">
            
            {pages.length > 0 ? (
              pages.map((page) => (
  <div
    key={page.id}
    className={`flex items-center justify-between px-2 py-1 rounded text-sm transition ${
      viewMode === "pages" && activePageId === page.id
        ? "bg-blue-50 text-blue-600 font-semibold border-l-2 border-blue-500"
        : "text-gray-600 hover:bg-gray-100"
    }`}
    onClick={(e) => handlePageClick(e, page.id)}
  >
{editingPageId === page.id ? (
  <input
    autoFocus
    value={pageNameDraft}
    onChange={(e) => setPageNameDraft(e.target.value)}
    onBlur={async () => {
      await renamePageApi(page.id, pageNameDraft);
      setEditingPageId(null);
    }}
    onKeyDown={async (e) => {
      if (e.key === "Enter") {
        await renamePageApi(page.id, pageNameDraft);
        setEditingPageId(null);
      }
      if (e.key === "Escape") setEditingPageId(null);
    }}
    onClick={(e) => e.stopPropagation()}
    className="w-full text-sm px-1 border border-gray-300 rounded"
  />
) : (
  <span onDoubleClick={() => setEditingPageId(page.id)}>
    {page.name}
  </span>
)}



    {/* ✏️ Pencil icon */}
    <div className="flex items-center gap-2">
  {/* ✏️ Rename icon */}
  <Pencil
    size={14}
    className="text-gray-400 hover:text-blue-600 cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      setEditingPageId(page.id);
      setPageNameDraft(page.name);
    }}
  />

  {/* 🗑 Delete icon */}
  <Trash2
    size={14}
    className="text-red-400 hover:text-red-600 cursor-pointer"
    onClick={(e) => {
      e.stopPropagation();
      setDeletingPage(page); // ✅ Open delete confirmation modal
    }}
  />
</div>

  </div>
))

            ) : (
              <div className="text-xs text-gray-400 italic py-1">
                No pages available
              </div>
            )}
          </div>
        )}
      </div>

            {/* 🗂 Layers Button */}
<div
  className={getTabClass("pages")}
  onClick={() => {
    setViewMode("pages");
    setShowLayersPanel(prev => !prev);
  }}
>
  <span className="text-sm font-medium">Elements</span>
</div>

      {/* 🧩 MAIN SECTION */}
<div className="border-b border-gray-200">
  <SectionHeader
    title="Add Elements"
    expanded={expandedSections.main}
    onClick={() => toggleSection("main")}
  />

  {expandedSections.main && (
    <>
      {/* 🔍 Element Search */}
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search elements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="pl-3 space-y-1">
        {/* 🧱 CONTAINERS */}
        <SectionHeader
          title="Containers"
          expanded={expandedSections.containers}
          onClick={() => toggleSection("containers")}
        />

        {(expandedSections.containers || isSearching) && (
  <div className="pl-4 space-y-1">
    {[
      { name: "Row Container", type: "row-container" },
      { name: "Column Container", type: "column-container" },
      { name: "Repeating Groups", type: "repeating_group" },
      { name: "Popup", type: "popup" },
    ]
      .filter(el =>
        el.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((element) => (
        <div
          key={element.type}
          className="px-2 py-1 rounded text-sm text-gray-600 cursor-pointer
                     hover:bg-gray-100 transition"
          onClick={() => addElement(element.type)}
        >
          {element.name}
        </div>
      ))}
  </div>
)}

{/* 🎨 VISUAL ELEMENTS */}
<SectionHeader
  title="Visual Elements"
  expanded={expandedSections.visual}
  onClick={() => toggleSection("visual")}
/>

{(expandedSections.visual || isSearching) && (
  <div className="pl-4 space-y-1">
    {elementTypes
      .filter(
        (el) =>
          ![
            "row-container",
            "column-container",
            "repeating_group",
          ].includes(el.type)
      )
      .filter(el =>
        el.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((element) => (
        <div
          key={element.type}
          className="px-2 py-1 rounded text-sm text-gray-600 cursor-pointer
                     hover:bg-gray-100 transition"
          onClick={() => addElement(element.type)}
        >
          {element.name}
        </div>
      ))}
  </div>
)}
      </div>
    </>
  )}
</div>

{showCreatePageModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onClick={() => setShowCreatePageModal(false)}
  >
    <div
      className="bg-white rounded-xl shadow-xl w-80 p-5 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
          +
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          Create New Page
        </h3>
      </div>

      {/* Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Page name
        </label>
        <input
          autoFocus
          type="text"
          placeholder="e.g. Home, Profile, Checkout"
          value={newPageName}
          onChange={(e) => setNewPageName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1.5 text-sm rounded-md text-gray-600 hover:bg-gray-100"
          onClick={() => setShowCreatePageModal(false)}
        >
          Cancel
        </button>

        <button
          disabled={!newPageName.trim()}
          className={`px-3 py-1.5 text-sm rounded-md text-white transition
            ${
              newPageName.trim()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          onClick={async () => {
            if (!newPageName.trim()) return;

            try {
              const backendPage = await createPageApi(newPageName.trim());

              const lastId = pages.length
                ? Math.max(...pages.map((p) => Number(p.id) || 0))
                : 0;

              const newId = (lastId + 1).toString();

              const typedPage = {
                ...backendPage,
                id: newId,
                type: "page",
                parentId: null,
                indexInParent: pages.length,
                children: backendPage.children || [],
              };

              setTree((prev) => ({
                ...prev,
                pages: [...(prev.pages || []), typedPage],
                activePageId: typedPage.id,
              }));

              setNewPageName("");
              setShowCreatePageModal(false);
            } catch (err) {
              console.error(err);
              alert("Failed to create page");
            }
          }}
        >
          Create Page
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete Page Modal */}
{deletingPage && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/50 backdrop-blur-sm"
    onClick={() => setDeletingPage(null)}
  >
    <div
      className="bg-white rounded-xl shadow-xl w-80 p-5 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 flex items-center justify-center
                        rounded-full bg-red-100 text-red-600">
          🗑️
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          Delete Page
        </h3>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600 leading-relaxed">
        Are you sure you want to delete{" "}
        <span className="font-medium text-gray-800">
          “{deletingPage.name}”
        </span>
        ?<br />
      </p>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-5">
        <button
          className="px-3 py-1.5 text-sm rounded-md text-gray-600
                     hover:bg-gray-100"
          onClick={() => setDeletingPage(null)}
        >
          Cancel
        </button>

        <button
          className="px-3 py-1.5 text-sm rounded-md text-white
                     bg-red-600 hover:bg-red-700 transition"
          onClick={async () => {
            try {
              const token = useAuthStore.getState().accessToken;
              const projectId = useCanvasStore.getState().projectId;

              const res = await fetch(
                `${BACKEND_URL}/api/generate/projects/${projectId}/pages/${deletingPage.id}/`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (!res.ok) throw new Error("Failed to delete page");

              setTree((prev) => ({
                ...prev,
                pages: (prev.pages || []).filter(
                  (p) => p.id !== deletingPage.id
                ),
                activePageId:
                  prev.activePageId === deletingPage.id
                    ? prev.pages[0]?.id || null
                    : prev.activePageId,
              }));

              setDeletingPage(null);
            } catch (err) {
              console.error(err);
              alert("Failed to delete page");
            }
          }}
        >
          Delete Page
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
