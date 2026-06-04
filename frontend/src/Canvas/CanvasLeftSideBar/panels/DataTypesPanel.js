// src/Canvas/CanvasLeftSideBar/panels/DataTypesPanel.js
import React, { useState, useRef } from "react";
import { useCanvasStore } from "../../CanvasStore"; // adjust path if needed

export default function DataTypesPanel({
  datatypes = [],
  setDatatypes,
  appdata = {},
  setAppdata,
  selectedDatatype,
  setSelectedDatatype,
}) {
  const [saving, setSaving] = useState(false); // <- ADD
  const [saveStatus, setSaveStatus] = useState(""); // <- ADD
   const saveLiveToBackend = useCanvasStore(state => state.saveLiveToBackend);
  const saveLiveTableandFieldNameToBackend = useCanvasStore(
    state => state.saveLiveTableandFieldNameToBackend
  );
  const liveappdata = useCanvasStore(state => state.liveappdata);
  const setLiveAppdata = useCanvasStore(state => state.setLiveAppdata);
  const tableRenames = useCanvasStore(state => state.tableRenames);
  const setTableRenames = useCanvasStore(state => state.setTableRenames);
  const fieldRenames = useCanvasStore(state => state.fieldRenames);
  const setFieldRenames = useCanvasStore(state => state.setFieldRenames);
  // 👇 Compute whether there are unsaved changes
  const hasUnsavedChanges =
    Object.keys(tableRenames || {}).length > 0 ||
    Object.keys(fieldRenames || {}).some(
      table => Object.keys(fieldRenames[table] || {}).length > 0
    );
    const [changesLog, setChangesLog] = useState({
  tableRenames: {}, // { oldName: newName }
  fieldRenames: {}, // { tableName: { oldField: newField } }
});
  const [leftWidth, setLeftWidth] = useState(280); // px
const isDraggingRef = useRef(false);

const handleMouseDown = () => {
  isDraggingRef.current = true;
  document.body.style.userSelect = "none";
};

const handleReplaceSchema = async () => {
  setSaving(true);
  const success = await saveLiveTableandFieldNameToBackend();
  setSaving(false);
  setSaveStatus(success ? "success" : "error");
};

const handleMouseMove = (e) => {
  if (!isDraggingRef.current || !containerRef.current) return;

  const rect = containerRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;

  const min = 200;
  const max = 500;

  setLeftWidth(Math.min(Math.max(x, min), max));
};


const handleMouseUp = () => {
  isDraggingRef.current = false;
  document.body.style.userSelect = "";
};

React.useEffect(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, []);
const containerRef = useRef(null);

  const getNextTableName = (datatypes) => {
  const base = "NewTable";
  const numbers = (datatypes || [])
    .map(dt => dt.name)
    .filter(name => name.startsWith(base))
    .map(name => {
      const n = parseInt(name.replace(base, ""), 10);
      return isNaN(n) ? 0 : n;
    });

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `${base}${next}`;
};

const handleDeleteDatatype = (dt) => {
  // 1️⃣ remove from schema
  const updatedDatatypes = datatypes.filter(d => d.id !== dt.id);
  setDatatypes(updatedDatatypes);

  // 2️⃣ remove appdata table (ORDER SAFE)
  const reorderedAppdata = {};
  Object.keys(appdata || {}).forEach((key) => {
    if (key !== dt.name) {
      reorderedAppdata[key] = appdata[key];
    }
  });
  setAppdata(reorderedAppdata);

  // 3️⃣ reset selection
  if (selectedDatatype?.id === dt.id) {
    setSelectedDatatype(null);
  }
};

  return (
<div
  ref={containerRef}
  className="flex h-full p-6 bg-gray-50"
>
      {/* LEFT: Data Model Names */}
<div
  style={{ width: leftWidth }}
  className="border-r border-gray-200 pr-4 overflow-y-auto shrink-0"
>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Data Models</h2>

        {(datatypes || []).length > 0 ? (
  datatypes.map((dt) => (
    <div
      key={dt.id}
      className={`flex items-center justify-between p-3 mb-2 rounded-md cursor-pointer transition ${
        selectedDatatype?.id === dt.id
          ? "bg-blue-100 border border-blue-400 text-blue-700"
          : "bg-white border border-gray-200 hover:bg-gray-100"
      }`}
      onClick={() => setSelectedDatatype(dt)}
    >
      <span className="truncate">{dt.name}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteDatatype(dt);
        }}
        className="text-red-500 hover:text-red-700 text-sm ml-2"
        title="Delete table"
      >
        ✕
      </button>
    </div>
  ))
) : (
  <p className="text-gray-500 italic">No data types available</p>
)}

        <button
  onClick={() => {
  const tableName = getNextTableName(datatypes);

  const newDt = {
    id: crypto.randomUUID(),
    name: tableName,
    fields: [],
    defaultValue: {},
  };

  // 1️⃣ add schema
  setDatatypes([...(datatypes || []), newDt]);
  setSelectedDatatype(newDt);

  // 2️⃣ init appdata table
  setAppdata({
    ...(appdata || {}),
    [tableName]: [],
  });
}}

  className="w-full mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-sm"
>
  + Add Data Type
</button>

      </div>
{/* DRAG HANDLE */}
<div
  onMouseDown={handleMouseDown}
  title="Drag to resize"
  className="
    w-2
    -mx-1
    cursor-col-resize
    bg-gray-200
    hover:bg-indigo-400
    transition
  "
/>


      {/* RIGHT: Data Model Editor */}
<div className="flex-1 pl-6 overflow-y-auto">
  {selectedDatatype ? (
    <div>
      {/* Table Name Input */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-300 pb-2">
        <input
          type="text"
          value={selectedDatatype.name || ""}
          onChange={(e) => {
  // Table Name Input onChange
const oldName = selectedDatatype.name;
const newName = e.target.value.trim();
if (!newName || newName === oldName) return;

const updated = { ...selectedDatatype, name: newName };
setSelectedDatatype(updated);
setDatatypes(datatypes.map(dt => dt.id === selectedDatatype.id ? updated : dt));

// Migrate appdata
if (appdata?.[oldName]) {
  const reordered = {};
  Object.keys(appdata).forEach((key) => {
    if (key === oldName) {
      reordered[newName] = appdata[oldName];
    } else {
      reordered[key] = appdata[key];
    }
  });
  setAppdata(reordered);
}

// Record rename
setTableRenames({
  ...tableRenames,
  [oldName]: newName
});
}}


          className="text-2xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800"
        />
        <span className="text-gray-400 text-sm">
          {selectedDatatype.fields?.length || 0} fields
        </span>
      </div>

      {/* Field Editor */}
<div className="space-y-3">
  {(selectedDatatype.fields || []).map((field, index) => {
    const isPrimitive = ["text", "number", "email", "date", "boolean", "image"].includes(field.type);
    const canHaveDefault = isPrimitive && field.cardinality !== "list";

    return (
      <div
        key={index}
        className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200"
      >
        {/* Field Name */}
        <input
          type="text"
          value={field.name || ""}
          onChange={(e) => {
  const oldField = field.name;
const newField = e.target.value.trim();
if (!newField || newField === oldField) return;

// Update schema
const fields = selectedDatatype.fields.map((f, i) =>
  i === index ? { ...f, name: newField } : f
);

// Migrate defaultValue
const defaultValue = { ...(selectedDatatype.defaultValue || {}) };
if (defaultValue.hasOwnProperty(oldField)) {
  defaultValue[newField] = defaultValue[oldField];
  delete defaultValue[oldField];
}

const updated = { ...selectedDatatype, fields, defaultValue };

// Migrate appdata
const tableName = selectedDatatype.name;
if (appdata?.[tableName]) {
  const tableData = appdata[tableName].map((row) => {
    if (row.hasOwnProperty(oldField)) {
      const newRow = { ...row };
      newRow[newField] = newRow[oldField];
      delete newRow[oldField];
      return newRow;
    }
    return row;
  });

  const reorderedAppdata = {};
  Object.keys(appdata).forEach((key) => {
    reorderedAppdata[key] = key === tableName ? tableData : appdata[key];
  });
  setAppdata(reorderedAppdata);

  // Record field rename
  setFieldRenames({
    ...fieldRenames,
    [tableName]: {
      ...(fieldRenames?.[tableName] || {}),
      [oldField]: newField
    }
  });
}

// Update UI + schema
setSelectedDatatype(updated);
setDatatypes(
  datatypes.map(dt => dt.id === selectedDatatype.id ? updated : dt)
);
}}
          className="flex-1 border-b border-gray-300 text-sm"
        />

        {/* Field Type */}
        <select
          value={field.type || "text"}
          onChange={(e) => {
                        const fields = selectedDatatype.fields.map((f, i) =>
              i === index ? { ...f, type: e.target.value } : f
            );
            const updated = { ...selectedDatatype, fields };
            setSelectedDatatype(updated);
            setDatatypes(
              datatypes.map((dt) =>
                dt.id === selectedDatatype.id ? updated : dt
              )
            );
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="image">Image</option>
          <option value="date">Date</option>
          <option value="boolean">Boolean</option>
          <optgroup label="Data Types">
            {datatypes.map((dt) => (
              <option key={dt.name} value={dt.name}>
                {dt.name}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Cardinality */}
        <select
          value={field.cardinality || "single"}
          onChange={(e) => {
                        const fields = selectedDatatype.fields.map((f, i) =>
              i === index ? { ...f, cardinality: e.target.value } : f
            );
            const updated = { ...selectedDatatype, fields };
            setSelectedDatatype(updated);
            setDatatypes(
              datatypes.map((dt) =>
                dt.id === selectedDatatype.id ? updated : dt
              )
            );
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="single">Single</option>
          <option value="list">List</option>
        </select>

        {/* Default Value (Bubble rule) */}
        {canHaveDefault && (
          <input
            type="text"
            value={selectedDatatype.defaultValue?.[field.name] || ""}
            onChange={(e) => {
                            const updated = {
                ...selectedDatatype,
                defaultValue: {
                  ...(selectedDatatype.defaultValue || {}),
                  [field.name]: e.target.value,
                },
              };
              setSelectedDatatype(updated);
              setDatatypes(
                datatypes.map((dt) =>
                  dt.id === selectedDatatype.id ? updated : dt
                )
              );
            }}
            className="flex-1 border rounded px-2 py-1 text-sm"
          />
        )}

        {/* Delete */}
        <button
          onClick={() => {
                        const fields = selectedDatatype.fields.filter((_, i) => i !== index);
            const updated = { ...selectedDatatype, fields };
            setSelectedDatatype(updated);
            setDatatypes(
              datatypes.map((dt) =>
                dt.id === selectedDatatype.id ? updated : dt
              )
            );
          }}
          className="text-red-500"
        >
          ✕
        </button>
      </div>
    );
  })}
</div>


   {/* Add Field Button */}
<div className="mt-4">
  <button
    onClick={() => {
      const tableName = selectedDatatype.name;
      const existingNames = (selectedDatatype.fields || []).map(f => f.name);

      // Generate a unique field name
      let baseName = "newField";
      let counter = 1;
      let uniqueName = baseName;
      while (existingNames.includes(uniqueName)) {
        uniqueName = `${baseName}${counter}`;
        counter++;
      }

      const newField = { name: uniqueName, type: "text" };
      const fields = [...(selectedDatatype.fields || []), newField];
      const updated = { ...selectedDatatype, fields };

      // Update schema
      setSelectedDatatype(updated);
      setDatatypes(
        datatypes.map((dt) =>
          dt.id === selectedDatatype.id ? updated : dt
        )
      );

      // Update appdata
      if (appdata?.[tableName]) {
        let updatedTable = [...appdata[tableName]];

        if (updatedTable.length === 0) {
          updatedTable.push({ [newField.name]: "" });
        } else {
          updatedTable = updatedTable.map(row => ({
            ...row,
            [newField.name]: "",
          }));
        }

        setAppdata({
          ...appdata,
          [tableName]: updatedTable,
        });
      }
    }}
    className="
      w-full
  mt-4  px-4  py-2 rounded-lg  bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 hover:bg-indigo-100 transition"
  >
    + Add Field
  </button>
</div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-gray-500 italic">
      Select a data type to view or edit
    </div>
  )}
</div>

    </div>
  );
}
