// CanvasPropertiesPanelLayout.js

import React from "react";

export default function CanvasPropertiesPanelLayout({
  selectedElement,
  localStyle,
  setLocalStyle,
  handleStyleChange,
  stopPropagation,
  updateElementStyle
}) {
  return (
    <div className="space-y-4">

      {/* CHILDREN LIST (for container-type elements) */}
      {Array.isArray(selectedElement.children) && selectedElement.children.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Children ({selectedElement.children.length})
          </label>

          <div className="space-y-1">
            {selectedElement.children.map((child) => (
              <button
                key={child.id}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("canvas-select-element", { detail: child.id }))
                }
                className="w-full text-left px-3 py-2 text-sm border rounded-md hover:bg-gray-100"
              >
                {child.type.toUpperCase()} — {child.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flex Direction */}
      {selectedElement.style?.display === "flex" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Flex Direction</label>
          <select
            onMouseDown={stopPropagation}
            value={localStyle.flexDirection || "row"}
            onChange={(e) => handleStyleChange("flexDirection", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="row">Row</option>
            <option value="column">Column</option>
          </select>
        </div>
      )}

     {/* Text Align (show only if NOT flex AND not image AND element is text-like) */}
    {selectedElement.style?.display !== "flex" &&
      !["image"].includes(selectedElement.type) &&
      ["text", "button", "textarea", "input"].includes(selectedElement.type) && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Text Align
          </label>
          <select
            onMouseDown={stopPropagation}
            value={localStyle.textAlign}
            onChange={(e) => handleStyleChange("textAlign", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      )}

    {/* Flex Controls — show only when display:flex */}
    {selectedElement.style?.display === "flex" && (
      <>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Justify Content
          </label>
          <select
            onMouseDown={stopPropagation}
            value={localStyle.justifyContent}
            onChange={(e) => handleStyleChange("justifyContent", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="flex-start">Flex Start</option>
            <option value="center">Center</option>
            <option value="flex-end">Flex End</option>
            <option value="space-between">Space Between</option>
            <option value="space-around">Space Around</option>
            <option value="space-evenly">Space Evenly</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Align Items
          </label>
          <select
            onMouseDown={stopPropagation}
            value={localStyle.alignItems}
            onChange={(e) => handleStyleChange("alignItems", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="stretch">Stretch</option>
            <option value="flex-start">Flex Start</option>
            <option value="center">Center</option>
            <option value="flex-end">Flex End</option>
            <option value="baseline">Baseline</option>
          </select>
        </div>
      </>
    )}

    {/* Align Self — show ONLY if NOT flex */}
    {selectedElement.style?.display !== "flex" && (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Align Self
        </label>
        <select
          onMouseDown={stopPropagation}
          value={localStyle.alignSelf}
          onChange={(e) => handleStyleChange("alignSelf", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="initial">Auto</option>
          <option value="flex-start">Flex Start</option>
          <option value="center">Center</option>
          <option value="flex-end">Flex End</option>
          <option value="baseline">Baseline</option>
          <option value="stretch">Stretch</option>
        </select>
      </div>
    )}

            {/* Gap */}
            {selectedElement.style?.display === "flex" && (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">Gap</label>
    <input
      type="number"
      onMouseDown={stopPropagation}
      value={localStyle.gap}
      onChange={(e) => {
        const v = parseInt(e.target.value);
        setLocalStyle((prev) => ({ ...prev, gap: isNaN(v) ? "" : v }));
        handleStyleChange("gap", isNaN(v) ? 0 : v);
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
    />
  </div>
)}

            {/* Margin */}
            <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Margin</label>

  <div className="grid grid-cols-2 gap-2">
    <input
      type="text"
      placeholder="Top"
      value={localStyle.marginTop}
      onMouseDown={stopPropagation}
      onChange={(e) => handleStyleChange("marginTop", e.target.value)}
      className="px-2 py-1 border rounded"
    />

    <input
      type="text"
      placeholder="Bottom"
      value={localStyle.marginBottom}
      onMouseDown={stopPropagation}
      onChange={(e) => handleStyleChange("marginBottom", e.target.value)}
      className="px-2 py-1 border rounded"
    />

    <input
      type="text"
      placeholder="Right"
      value={localStyle.marginRight}
      onMouseDown={stopPropagation}
      onChange={(e) => handleStyleChange("marginRight", e.target.value)}
      className="px-2 py-1 border rounded"
    />

    <input
      type="text"
      placeholder="Left"
      value={localStyle.marginLeft}
      onMouseDown={stopPropagation}
      onChange={(e) => handleStyleChange("marginLeft", e.target.value)}
      className="px-2 py-1 border rounded"
    />
  </div>
</div>


{/* Padding */}
<div>
  <label className="block text-xs font-medium text-gray-700 mb-1">Padding</label>

  <div className="grid grid-cols-2 gap-2">
    {["Top", "Bottom", "Right", "Left"].map((side) => (
      <input
        key={side}
        type="text"
        placeholder={side}
        value={localStyle[`padding${side}`] || ""}
        onMouseDown={stopPropagation}
        onChange={(e) => {
          const val = e.target.value;
          setLocalStyle((prev) => ({ ...prev, [`padding${side}`]: val }));
          updateElementStyle(
            selectedElement.id,
            `padding${side}`,
            val ? val : "" // store empty string if user clears input
          );
        }}
        className="px-2 py-1 border rounded"
      />
    ))}
  </div>
</div>



            {/* Max Width */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Width</label>
              <input
                type="text"
                onMouseDown={stopPropagation}
                value={localStyle.maxWidth}
                onChange={(e) => setLocalStyle((prev) => ({ ...prev, maxWidth: e.target.value }))}
                onBlur={() => handleStyleChange("maxWidth", localStyle.maxWidth)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

    </div>
  );
}
