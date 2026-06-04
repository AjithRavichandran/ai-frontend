import React, { useState } from "react";

export default function SearchModifierSelector({
  disabled,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  if (disabled) return null;

  const options = [
    { label: "All items", value: "" },
    { label: "First item", value: "first" },
    { label: "Last item", value: "last" },
    { label: "Random item", value: "random" },
  ];

  return (
    <div className="relative inline-block">
      {/* ICON BUTTON */}
      <button
        type="button"
        className="px-2 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
        onClick={() => setOpen((o) => !o)}
        title="Result options"
      >
        more
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 z-10 mt-1 bg-white border rounded shadow-md w-36">
          {options.map((opt) => (
            <div
              key={opt.label}
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
