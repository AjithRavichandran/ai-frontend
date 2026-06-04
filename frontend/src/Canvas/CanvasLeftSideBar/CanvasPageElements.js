import React, { useState, useMemo, useEffect } from "react";
import CanvasRendererEditor from "../CanvasRenderer/CanvasEditorRenderer";
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

const CanvasPageElements = React.forwardRef(({
  activePageChildren = [],
  selectedElementId,
  setSelectedElementId,
  handlers,
  tree,
  elementsMap,
}, ref) => {

const [collapsed, setCollapsed] = useState({
  overlays: false,
  layers: false,
});
  const [query, setQuery] = useState("");
  const toggleCollapse = (id) =>
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  const getElementLabel = (el) =>
    el.name || el.content || el.value || el.type || "Element";

  const matchesQuery = (el) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(el.id).includes(q) ||
      getElementLabel(el).toLowerCase().includes(q) ||
      (el.type || "").toLowerCase().includes(q)
    );
  };

  /* ---------------- OVERLAYS ---------------- */
useEffect(() => {
  if (!query) return;
  setCollapsed({});
}, [query]);

  const overlayRoots = useMemo(() => {
    if (!tree) return [];
    const overlayTypes = ["popup", "modal", "dialog"];

    const collect = (nodes = []) =>
      nodes.flatMap((n) => [
        ...(overlayTypes.includes(n.type) ? [n] : []),
        ...(n.children ? collect(n.children) : []),
      ]);

    return [
      ...collect(activePageChildren),
      ...(tree.globalPopups?.children
        ? collect(tree.globalPopups.children)
        : []),
    ];
  }, [activePageChildren, tree]);

  const layerRoots = useMemo(
    () => activePageChildren.filter((el) => el.type !== "popup"),
    [activePageChildren]
  );

  const filterTree = (nodes) =>
    nodes
      .map((n) => {
        const kids = filterTree(n.children || []);
        if (matchesQuery(n) || kids.length) return { ...n, children: kids };
        return null;
      })
      .filter(Boolean);

  const filteredOverlays = query ? filterTree(overlayRoots) : overlayRoots;
  const filteredLayers = query ? filterTree(layerRoots) : layerRoots;

  /* ---------------- ROW ---------------- */

  const Row = ({ el, level }) => {
    const liveEl = elementsMap?.[el.id] || el;
    const hasChildren = liveEl.children?.length > 0;
    const isCollapsed = collapsed[liveEl.id];
    const isSelected = selectedElementId === liveEl.id;
    return (
      <div className="relative">
        <div
  onClick={(e) => {
    if (e.target.closest("[data-action]")) return;

    e.stopPropagation();
    setSelectedElementId(liveEl.id);
  }}
  className={`group relative flex items-center rounded-md px-2 py-2 cursor-pointer
    transition-colors
    hover:bg-gray-50
    ${isSelected ? "bg-blue-50 ring-1 ring-blue-200" : ""}
  `}
  style={{
    paddingLeft: level * 14 + 14,
  }}
>

          {/* ✅ LEFT SELECTION BAR */}
  {isSelected && (
    <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-500 rounded-l-md" />
  )}
          {/* Chevron */}
          {hasChildren ? (
            <button
  onClick={(e) => { e.stopPropagation(); toggleCollapse(liveEl.id); }}
  className="flex items-center justify-center h-5 w-5 rounded hover:bg-gray-100"
>

              {isCollapsed ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Label */}
<div className="flex flex-1 items-center">            <div>
              <div className="text-sm font-medium truncate">{getElementLabel(liveEl)}</div>
<div className="text-[10px] text-gray-400 truncate">
  {liveEl.type}
</div>

            </div>
          </div>

          {/* Hover actions */}
<div className="
  absolute right-2 top-2 flex items-center gap-1
  opacity-40
  group-hover:opacity-100
  transition-opacity duration-150
">

<button
  data-action
  onMouseDown={(e) => e.stopPropagation()} // 🔥 REQUIRED
  onClick={(e) => {
    e.stopPropagation();
    handlers.onToggleVisibility(liveEl.id);
  }}
  className="rounded p-1 hover:bg-gray-100"
>
  {liveEl.type === "popup" || liveEl.type === "modal" ? (
    liveEl.isOpen ? (
      <Eye size={13} className="text-gray-600" />
    ) : (
      <EyeOff size={13} className="text-gray-400" />
    )
  ) : liveEl.hidden ? (
    <EyeOff size={13} className="text-gray-400" />
  ) : (
    <Eye size={13} className="text-gray-600" />
  )}
</button>


<button
  data-action
  onMouseDown={(e) => e.stopPropagation()} // 🔥 REQUIRED
  onClick={(e) => e.stopPropagation()}
  className="rounded p-1 hover:bg-gray-100"
>
  <Lock size={13} className="text-gray-500" />
</button>

</div>

        </div>

        {/* Children */}
        {!isCollapsed &&
          hasChildren &&
          liveEl.children
            .slice()
            .sort((a, b) => a.indexInParent - b.indexInParent)
            .map((c) => <Row key={c.id} el={c} level={level + 1} />)}

        {/* FLOATING PREVIEW (NO OVERLAP) */}
{/* FLOATING PREVIEW */}
<div
  data-preview
  className="
    absolute left-full top-1 ml-3 z-50
    opacity-0 pointer-events-none
    group-hover:opacity-100
    transition-opacity duration-200
  "
>
  <div className="rounded-md border border-gray-200 bg-white shadow-lg p-2">
    <div
      style={{
        width: 200,
        height: 120,
        transform: "scale(0.35)",
        transformOrigin: "top left",
      }}
    >
      <CanvasRendererEditor element={liveEl} handlers={null} />
    </div>
  </div>
</div>
      </div>
    );
  };

  /* ---------------- RENDER ---------------- */

return (
  <div
    ref={ref}   // 🔥 THIS IS REQUIRED
    className="flex h-full w-[300px] flex-col border-r bg-white"
  >
    <div className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="font-semibold">Elements</div>
        <div className="mt-2 flex items-center gap-2 border rounded px-2 py-1">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter elements"
            className="w-full outline-none text-[12px]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
      {/* OVERLAYS */}
{filteredOverlays.length > 0 && (
  <>
    <div
  onClick={() => toggleCollapse("overlays")}
  className="
    flex items-center justify-between
    px-3 py-2 mb-1
    rounded-md cursor-pointer
    bg-gray-50 hover:bg-gray-100
    text-[11px] font-semibold uppercase text-gray-600
  "
>
  <div className="flex items-center gap-1">
    {collapsed.overlays ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
    Popups
  </div>
</div>

    {!collapsed.overlays &&
      filteredOverlays.map((el) => (
        <Row key={el.id} el={el} level={0} />
      ))}
  </>
)}


    {/* Page Elements */}
<div
  onClick={() => toggleCollapse("layers")}
  className="
    flex items-center justify-between
    px-3 py-2 mt-2 mb-1
    rounded-md cursor-pointer
    bg-gray-50 hover:bg-gray-100
    text-[11px] font-semibold uppercase text-gray-600
  "
>
  <div className="flex items-center gap-1">
    {collapsed.layers ? (
      <ChevronRight size={12} />
    ) : (
      <ChevronDown size={12} />
    )}
    Elements
  </div>
</div>

{!collapsed.layers &&
  filteredLayers.map((el) => (
    <Row key={el.id} el={el} level={0} />
  ))}



      </div>
    </div>

);

}
)

export default CanvasPageElements;