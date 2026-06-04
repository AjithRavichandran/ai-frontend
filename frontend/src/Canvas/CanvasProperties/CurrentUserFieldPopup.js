// CurrentUserFieldPopup.js
import React, { useEffect, useState } from "react";
import PopupPortal from "./PopupPortal";

export default function CurrentUserFieldPopup({
  isOpen,
  anchorRect,
  userFields = [],
  selectedField,
  onClose,
  onSelect, // must be passed in
}) {
  const [fields, setFields] = useState(userFields);

  useEffect(() => {
    if (isOpen) setFields(userFields);
  }, [isOpen, userFields]);

  if (!isOpen) return null;

  const popupStyle = anchorRect
  ? {
      position: "absolute",
      top: anchorRect.top,
      left: anchorRect.left,
      zIndex: 999999,
    }
  : {};


  return (
    <PopupPortal>
      <div
        style={popupStyle}
        className="bg-gray-900 border border-gray-700 rounded-md p-3 w-[240px] text-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-100 font-medium">Select User Field</h3>
          <button className="text-gray-400 hover:text-gray-200" onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
          {fields.map((f) => (
            <button
              key={f.name}
              className={`px-2 py-1 rounded text-left text-white hover:bg-gray-700 ${
                selectedField === f.name ? "bg-blue-600" : ""
              }`}
              onClick={() => onSelect(f.name)} // ✅ ONLY call the prop
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </PopupPortal>
  );
}
