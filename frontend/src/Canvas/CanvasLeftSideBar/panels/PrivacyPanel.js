// src/Canvas/CanvasLeftSideBar/panels/PrivacyPanel.js

import React from "react";

export default function PrivacyPanel({
  datatypes = [],
  setDatatypes,
  selectedDatatype,
  setSelectedDatatype,
}) {
  const privacyOptions = [
    { label: "Everyone", value: "everyone" },
    { label: "Only Owner", value: "owner" },
    { label: "Admins", value: "admins" },
  ];

  const currentPrivacy = selectedDatatype?.privacy || {
    view: "everyone",
    edit: "owner",
    delete: "owner",
  };

  const updatePrivacy = (key, value) => {
    const updated = {
      ...selectedDatatype,
      privacy: { ...currentPrivacy, [key]: value },
    };

    setSelectedDatatype(updated);
    setDatatypes(
      datatypes.map((dt) =>
        dt.name === selectedDatatype.name ? updated : dt
      )
    );
  };

  return (
    <div className="flex h-full p-6 bg-gray-50">
      {/* Left panel: list of datatypes */}
      <div className="w-1/4 border-r border-gray-200 pr-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Data Models</h2>

        {(datatypes || []).length > 0 ? (
          datatypes.map((dt, i) => (
            <div
              key={i}
              className={`p-3 mb-2 rounded-md cursor-pointer transition ${
                selectedDatatype?.name === dt.name
                  ? "bg-blue-100 border border-blue-400 text-blue-700"
                  : "bg-white border border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => setSelectedDatatype(dt)}
            >
              {dt.name}
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No data types available</p>
        )}
      </div>

      {/* Right panel: privacy rules editor */}
<div className="flex-1 pl-6 overflow-y-auto">
  {selectedDatatype ? (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Privacy Rules for {selectedDatatype.name}
      </h2>

      <div className="space-y-4">
        {/* VIEW RULE */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-gray-700 font-medium">View:</label>
          <select
            value={currentPrivacy.view}
            onChange={(e) => updatePrivacy("view", e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {privacyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* EDIT RULE */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-gray-700 font-medium">Edit:</label>
          <select
            value={currentPrivacy.edit}
            onChange={(e) => updatePrivacy("edit", e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {privacyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* DELETE RULE */}
        <div className="flex items-center gap-4">
          <label className="w-24 text-gray-700 font-medium">Delete:</label>
          <select
            value={currentPrivacy.delete}
            onChange={(e) => updatePrivacy("delete", e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            {privacyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-500 italic">
      Select a data type to set privacy rules
    </div>
  )}
</div>

    </div>
  );
}
