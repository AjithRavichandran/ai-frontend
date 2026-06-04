import React, { useState } from "react";
import { useCanvasStore } from "../../CanvasStore";
import { useEffect } from "react";
import { BACKEND_URL } from "../../../config";
import { useAuthStore } from "../../../authStore";

export default function AppDataPanel({
  datatypes = {},
  schema = [], 
  setDatatypes,
  selectedDatatype,
  setSelectedDatatype,
}) {
  
const clearRenames = useCanvasStore((state) => state.clearRenames);

  const [focusedMeta, setFocusedMeta] = useState(null);
  const [dbMode, setDbMode] = useState("preview"); // "preview" | "live"
const saveLiveToBackend = useCanvasStore((state) => state.saveLiveToBackend);
const saveLiveTableandFieldNameToBackend = useCanvasStore(
  (state) => state.saveLiveTableandFieldNameToBackend
);
const [editingTable, setEditingTable] = useState(null);
const [tableNameInput, setTableNameInput] = useState("");
const [editingField, setEditingField] = useState(null);
const [fieldNameInput, setFieldNameInput] = useState("");

const [saveStatus, setSaveStatus] = useState(null);
// "success" | "error" | null
const [confirmAction, setConfirmAction] = useState(null);
const [confirmChecked, setConfirmChecked] = useState(false);
const [confirmText, setConfirmText] = useState("");
const hasUnsavedChanges = useCanvasStore(
  (state) => state.hasUnsavedChanges()
);

// reset edit state on DB mode change
useEffect(() => {
  setEditingTable(null);
  setTableNameInput("");
  setEditingField(null);
  setFieldNameInput("");
}, [dbMode]);


  // ✅ live appdata from store
  const liveappdata = useCanvasStore((state) => state.liveappdata);
  const setLiveAppdata = useCanvasStore((state) => state.setLiveAppdata);
const [saving, setSaving] = useState(false);

  const currentData = dbMode === "live" ? liveappdata : datatypes;
  const setCurrentData = dbMode === "live" ? setLiveAppdata : setDatatypes;

const handleCellClick = (table, rowIndex, key) => {
  setFocusedMeta({ table, rowIndex, key });
};

const resolvesrc = (value) => {
  if (!value) return null;

  // already a URL or blob
  if (typeof value === "string") {
    if (value.startsWith("blob:")) return value;
    if (value.startsWith("http")) return value;
    return `${BACKEND_URL}/media/${value.replace(/^\/+/, "")}`;
  }

  // future: media object
  if (typeof value === "object" && value.url) {
    return value.url;
  }

  return null;
};

const datatypeSchemaMap = React.useMemo(() => {
  const map = {};
  schema.forEach((dt) => {

    map[dt.name] = {};
    dt.fields.forEach((f) => {
      map[dt.name][f.name] = f; // { type, cardinality, relation }
    });
  });
  return map;
}, [schema]);

const isImageField = (table, field) => {
  return datatypeSchemaMap?.[table]?.[field]?.type === "image";
};

const handleImageUpload = async (table, rowIndex, key, file) => {
  if (!file) return;

  const localUrl = URL.createObjectURL(file);
  updateCellValue(table, rowIndex, key, localUrl);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const token = useAuthStore.getState().accessToken;

    const res = await fetch(`${BACKEND_URL}/api/generate/upload-image/${table}/`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    if (data.success && data.src) {
      const backendUrl = `${BACKEND_URL}/${data.src}`;
      updateCellValue(table, rowIndex, key, backendUrl);
    }
  } catch (err) {
    console.error("Image upload failed:", err);
  }
};


  const handleAddRow = (table) => {
    const keys = Object.keys((currentData[table] && currentData[table][0]) || {});
    const emptyRow = keys.reduce((acc, key) => ({ ...acc, [key]: "" }), {});
    const updatedRecords = [...(currentData[table] || []), emptyRow];
    setCurrentData({ ...currentData, [table]: updatedRecords });
    setSelectedDatatype({ table, records: updatedRecords });
  };

  const handleDeleteRow = (table, rowIndex) => {
    const updatedRecords = (currentData[table] || []).filter((_, i) => i !== rowIndex);
    setCurrentData({ ...currentData, [table]: updatedRecords });
    setSelectedDatatype({ table, records: updatedRecords });
  };

  const isEditingCell = (table, rowIndex, key) =>
  focusedMeta &&
  focusedMeta.table === table &&
  focusedMeta.rowIndex === rowIndex &&
  focusedMeta.key === key;

const moveCursorToEnd = (el) => {
  if (!el) return;
  const len = el.value.length;
  el.setSelectionRange(len, len);
};

const updateCellValue = (table, rowIndex, key, value) => {
  if (!currentData[table]) return;

  const updatedRecords = currentData[table].map((r, i) =>
    i === rowIndex ? { ...r, [key]: value } : r
  );

  setCurrentData({ ...currentData, [table]: updatedRecords });
  setSelectedDatatype({ table, records: updatedRecords });
};

useEffect(() => {
  if (!selectedDatatype?.table) return;

  const table = selectedDatatype.table;
  const records = currentData[table] || [];

  setSelectedDatatype({ table, records });
}, [dbMode]); // 👈 key fix
const autoResizeTextarea = (el) => {
  if (!el) return;
  el.style.height = "auto"; // reset previous height
  el.style.height = el.scrollHeight + "px"; // grow to fit content
};


const requiredConfirmText =
  confirmAction === "schema"
    ? "Replace Live Database Schema"
    : "Save Live Database";
function LiveWarning({ message, note }) {
  return (
    <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
      <span className="text-lg">⚠</span>
      <div className="flex flex-col">
        <p>{message}</p>
        {note && <p className="mt-1 text-xs">{note}</p>}
      </div>
    </div>
  );
}

  return (
    <>
      {/* DB Toggle */}
{/* DB MODE PANEL */}
<div className="mb-5 bg-white border rounded-xl shadow-sm p-4">
  
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">
        Database Mode
      </p>
      <p className="text-lg font-semibold">
        {dbMode === "live" ? (
          <span className="text-red-600">Live Database</span>
        ) : (
          <span className="text-green-600">Preview Database</span>
        )}
      </p>
    </div>

    <button
      onClick={() =>
        setDbMode(dbMode === "preview" ? "live" : "preview")
      }
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition
        ${
          dbMode === "preview"
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
    >
      {dbMode === "preview"
        ? "Switch to Live"
        : "Switch to Preview"}
    </button>
  </div>

  {/* Live Mode Warning */}
 {dbMode === "live" && (
  <LiveWarning
    message={
      <>
        You are working on the <b>Live Database</b>. Changes here may affect production data.
      </>
    }
  />
)}


  {/* Actions */}
  {dbMode === "live" && (
    <div className="flex flex-wrap gap-3 justify-end">
      
      {/* Schema replace */}
      <button
  onClick={() => setConfirmAction("schema")}
  disabled={!hasUnsavedChanges || saving} // disable if no changes or while saving
  className={`
    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition
    ${hasUnsavedChanges && !saving
      ? "bg-purple-600 hover:bg-purple-700 text-white"
      : "bg-gray-400 cursor-not-allowed text-white"}
  `}
>
  Replace Preview into Live (Table and Field Name)
</button>


      {/* Save */}
      <button
        disabled={saving}
        onClick={() => setConfirmAction("save")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-semibold transition
          ${
            saving
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
      >
        {saving ? " Saving…" : " Save Live Data"}
      </button>
    </div>
  )}


  {/* Status message */}
  {saveStatus && (
    <div
      className={`mt-3 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2
        ${
          saveStatus === "success"
            ? "bg-green-50 text-green-700 border border-green-300"
            : "bg-red-50 text-red-700 border border-red-300"
        }`}
    >
      {saveStatus === "success"
        ? "✓ Live AppData saved successfully. To see the result, refresh the page (F5)."
        : "✕ Failed to save Live AppData"}
    </div>
  )}
</div>

      <div className="flex h-full p-6 bg-gray-50">
        
        {/* LEFT SIDE: TABLE LIST */}
        <div className="w-1/4 border-r border-gray-300 pr-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">App Data</h2>

          {currentData && Object.keys(currentData).length > 0 ? (
  Object.entries(currentData).map(([table, records]) => (
    <div
  key={table}
  className={`p-3 mb-2 rounded-md transition ${
    selectedDatatype?.table === table
      ? "bg-blue-100 border border-blue-400"
      : "bg-white border border-gray-200 hover:bg-gray-100"
  }`}
>
  {dbMode === "live" && editingTable === table ? (
    <input
      autoFocus
      value={tableNameInput}
      onChange={(e) => setTableNameInput(e.target.value)}
      onBlur={() => {
        if (!tableNameInput || tableNameInput === table) {
          setEditingTable(null);
          return;
        }

        const updated = { ...currentData };
        updated[tableNameInput] = updated[table];
        delete updated[table];

        setCurrentData(updated);
        setSelectedDatatype({
          table: tableNameInput,
          records: updated[tableNameInput],
        });

        setEditingTable(null);
      }}
      className="w-full px-2 py-1 text-sm border rounded"
    />
  ) : (
    <div
  className="cursor-pointer font-medium text-gray-800"
  onClick={() => setSelectedDatatype({ table, records })}
>
  {table} ({records?.length || 0})
</div>

  )}
</div>

  ))
) : (
  <p className="text-gray-500 italic">No app data available</p>
)}

        </div>

        {/* RIGHT SIDE: DATA VIEW */}
        <div className="flex-1 pl-6 overflow-y-auto">

          {selectedDatatype ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedDatatype.table}
                </h2>
                <button
                  onClick={() => handleAddRow(selectedDatatype.table)}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition"
                >
                  + Add Row
                </button>
              </div>

              {Array.isArray(selectedDatatype.records) &&
              selectedDatatype.records.length > 0 ? (
                <div className="overflow-x-auto border border-gray-300 rounded-lg shadow-sm bg-white">
                  <table className="min-w-full text-sm border-collapse border-spacing-0">
                    <thead className="bg-gray-100 border-b border-gray-300">
                      <tr>
                        {Object.keys(selectedDatatype.records[0] || {}).map((key, i, arr) => (
                         <th
  key={key}
  className="px-4 py-2 text-left font-semibold text-gray-700
             border-r border-gray-300"
>


  {dbMode === "live" && editingField === key ? (
    <input
      autoFocus
      value={fieldNameInput}
      onChange={(e) => setFieldNameInput(e.target.value)}
      onBlur={() => {
        if (!fieldNameInput || fieldNameInput === key) {
          setEditingField(null);
          return;
        }

        const table = selectedDatatype.table;

        const updatedRecords = currentData[table].map((row) => {
          const newRow = { ...row };
          newRow[fieldNameInput] = newRow[key];
          delete newRow[key];
          return newRow;
        });

        setCurrentData({
          ...currentData,
          [table]: updatedRecords,
        });

        setSelectedDatatype({
          table,
          records: updatedRecords,
        });

        setEditingField(null);
      }}
      className="w-full px-1 py-0.5 text-sm border rounded"
    />
  ) : (
    key
  )}
</th>

                        ))}
                        <th className="px-4 py-2 text-left font-semibold text-gray-700 border-l border-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDatatype.records.map((record, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-300 hover:bg-gray-50 transition"
                        >
                          {Object.entries(record || {}).map(([k, v], idx, arr) => (
                            <td
  key={k}
  className="px-4 py-2 text-gray-800 align-top border-r border-gray-200"
>
  {isImageField(selectedDatatype.table, k) ? (
  <div className="flex flex-col gap-2">
    {(() => {
      const src = resolvesrc(v);

      return src ? (
        <img
          src={src}
          alt="uploaded"
          className="max-h-32 rounded border object-contain"
        />
      ) : (
        <div className="h-24 flex items-center justify-center text-xs text-gray-400 border rounded">
          No image
        </div>
      );
    })()}

    <label className="cursor-pointer text-xs text-blue-600 hover:underline">
      Upload image
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          handleImageUpload(
            selectedDatatype.table,
            i,
            k,
            e.target.files[0]
          )
        }
      />
    </label>
  </div>
) : isEditingCell(selectedDatatype.table, i, k) ? (
  <textarea
    autoFocus
    value={String(v ?? "")}
    onChange={(e) => {
      updateCellValue(selectedDatatype.table, i, k, e.target.value);
      autoResizeTextarea(e.target);
    }}
    onBlur={() => setFocusedMeta(null)}
    rows={1}
    className="w-full text-sm border border-blue-400 rounded px-1 py-1 resize-none"
  />
) : (
  <div
    className="cursor-pointer px-1 py-1 break-words whitespace-pre-wrap border rounded"
    onClick={() => handleCellClick(selectedDatatype.table, i, k)}
  >
    {v || "\u00A0"}
  </div>
)}

</td>

                          ))}
                          <td className="px-4 py-2 text-center border-l border-gray-200">
                            <button
                              onClick={() =>
                                handleDeleteRow(selectedDatatype.table, i)
                              }
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic border border-gray-200 rounded-lg bg-gray-50">
                  No records found for this table
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              Select a table to view its data
            </div>
          )}
          {confirmAction && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-[460px] p-6 border border-red-200">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">
          ⚠
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {confirmAction === "schema"
              ? "Replace Live Database Schema"
              : "Save Live Database"}
          </h3>
          <p className="text-xs text-gray-500">
            Please confirm before proceeding
          </p>
        </div>
      </div>

      {/* Message */}
      <div className="text-sm text-gray-700 leading-relaxed mb-4">
        {confirmAction === "schema" ? (
          <>
            You are about to <b className="text-red-600">
              overwrite ALL Live tables and fields
            </b>{" "}
            using Preview Datatypes.
            <br />
            <br />
            <span className="text-red-600 font-semibold">
              This will permanently remove existing Live data structure.
            </span>
          </>
        ) : (
          <>
            You are about to <b className="text-blue-600">
              permanently save
            </b>{" "}
            the Live database to the backend.
            <br />
            <br />
            <span className="font-semibold">
              This action cannot be undone.
            </span>
          </>
        )}
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-2 text-sm mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
          className="mt-1 accent-red-600"
        />
        <span>
          I understand that this action may cause{" "}
          <b className="text-red-600">permanent data loss</b>.
        </span>
      </label>
{/* Type-to-confirm */}
<div className="mb-5">
  <p className="text-xs text-gray-600 mb-2">
    Type <b className="text-red-600">"{requiredConfirmText}"</b> to confirm:
  </p>

  <input
    type="text"
    value={confirmText}
    onChange={(e) => setConfirmText(e.target.value)}
    placeholder={requiredConfirmText}
    className="w-full px-3 py-2 border rounded-md text-sm
      focus:outline-none focus:ring-2 focus:ring-red-500
      border-gray-300"
  />
</div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
  setConfirmAction(null);
  setConfirmChecked(false);
  setConfirmText("");
}}

          className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          Cancel
        </button>

        <button
          disabled={
  !confirmChecked || confirmText !== requiredConfirmText
}

          onClick={async () => {
            if (confirmAction === "schema") {
  setSaving(true);
  setSaveStatus(null);

  const success = await saveLiveTableandFieldNameToBackend();

  if (success) {
    clearRenames(); // ✅ THIS IS REQUIRED
  }

  setSaving(false);
  setSaveStatus(success ? "success" : "error");
  setTimeout(() => setSaveStatus(null), 3000);
}



            if (confirmAction === "save") {
              setSaving(true);
              setSaveStatus(null);

              const success = await saveLiveToBackend();

              setSaving(false);
              setSaveStatus(success ? "success" : "error");

              setTimeout(() => setSaveStatus(null), 3000);
            }

            setConfirmChecked(false);
setConfirmText("");
setConfirmAction(null);

          }}
          className={`px-4 py-2 rounded-md text-white transition ${
  confirmChecked && confirmText === requiredConfirmText
    ? confirmAction === "schema"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-blue-600 hover:bg-blue-700"
    : "bg-gray-400 cursor-not-allowed"
}`}

        >
          {confirmAction === "schema"
            ? "Yes, Replace Live Schema"
            : "Yes, Save Live Database"}
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </>
  );
}
