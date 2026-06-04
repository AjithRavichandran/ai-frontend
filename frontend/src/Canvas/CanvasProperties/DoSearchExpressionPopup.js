// src/components/DoSearchExpressionPopup.js

import React, { useState, useEffect } from "react";
import PopupPortal from "./PopupPortal";
import { getOperatorsForField } from "./CanvasOperator";

export default function DoSearchExpressionPopup({
  isOpen,
    datatypes = [],
    pageElements = [],
  initialValue,
  onClose,
  onConfirm,
  anchorRect,
  onChangeType, // optional (for positioning near button)
}) {
  const [datatype, setDatatype] = useState("");
  const [conditions, setConditions] = useState([]);
  const [modifier, setModifier] = useState("");
const [position, setPosition] = useState({ x: 0, y: 0 });
const [dragging, setDragging] = useState(false);
const [offset, setOffset] = useState({ x: 0, y: 0 });
const [nestedSearchIndex, setNestedSearchIndex] = useState(null);
const [nestedAnchorRect, setNestedAnchorRect] = useState(null);

useEffect(() => {
  if (!isOpen) return;

  if (anchorRect) {
    setPosition({
      x: anchorRect.left,
      y: anchorRect.bottom + 6,
    });
  } else {
    setPosition({
      x: window.innerWidth / 2 - 240,
      y: window.innerHeight / 2 - 150,
    });
  }
}, [isOpen, anchorRect]);
const onMouseDown = (e) => {
  setDragging(true);
  setOffset({
    x: e.clientX - position.x,
    y: e.clientY - position.y,
  });
};

const onMouseMove = (e) => {
  if (!dragging) return;
  setPosition({
    x: e.clientX - offset.x,
    y: e.clientY - offset.y,
  });
};

const onMouseUp = () => setDragging(false);

useEffect(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, [dragging, offset]);

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    if (!isOpen) return;

    setDatatype(initialValue?.type  || "");
    setConditions(
  initialValue?.conditions || [
    {
      left: { field: "" },
      operator: "",
      right: {
        source: "",
        field: "",
        value: "",
        search: null,
      },
    },
  ]
);


    setModifier(initialValue?.modifier || "");
  }, [isOpen]);

  if (!isOpen) return null;

  /* -------------------- HELPERS -------------------- */

const safeDatatypes = Array.isArray(datatypes) ? datatypes : [];

const fields =
  safeDatatypes.find(dt => dt.name === datatype)?.fields || [];

const userFields =
  safeDatatypes.find(dt => dt.name === "users")?.fields || [];

  const getFieldsForSource = (source) => {
    if (source === "current_user") return userFields;
    return [];
  };

  /* -------------------- CONDITION HANDLERS -------------------- */

const addCondition = () => {
  setConditions((prev) => [
    ...prev,
    {
      left: { field: "" },
      operator: "",
      right: {
        source: "",
        field: "",
        value: "",
        search: null,
      },
    },
  ]);
};



  const updateCondition = (index, key, value) => {
    const copy = [...conditions];
    copy[index][key] = value;
    setConditions(copy);
  };
  /* -------------------- POSITION -------------------- */

  const popupStyle = {
  position: "fixed",
  left: position.x,
  top: position.y,
  zIndex: 999999,
};



  /* -------------------- UI -------------------- */

  return (
    <PopupPortal>
      <div
        style={popupStyle}
        className="bg-gray-900 border border-gray-700 rounded-md p-3 w-[480px] text-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER (DRAG HANDLE) */}
<div
  className="flex justify-between items-center mb-2 cursor-move select-none"
  onMouseDown={onMouseDown}
>
  <h3 className="text-gray-100 font-medium">Do a search for</h3>
  <button
    className="text-gray-400 hover:text-gray-200"
    onClick={onClose}
  >
    ✕
  </button>
</div>



        {/* TYPE */}
        <select
  value={datatype}
  onChange={(e) => {
    const newType = e.target.value;   // ✅ DEFINE IT
    setDatatype(newType);
    setConditions([
  {
    left: { field: "" },
    operator: "",
    right: {
      source: "",
      field: "",
      value: "",
      search: null,
    },
  },
]);

    onChangeType?.(newType);          // ✅ now valid
  }}
  className="w-full mb-3 bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
>
  <option value="">Select type</option>
  {safeDatatypes.map((dt) => (

    <option key={dt.name} value={dt.name}>
      {dt.name}
    </option>
  ))}
</select>


        {/* CONDITIONS */}
        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div
              key={i}
              className="flex flex-wrap gap-2 items-start bg-gray-800 p-2 rounded"
            >
              {/* LEFT FIELD */}
              <select
value={c.left.field}
onChange={(e) =>
  updateCondition(i, "left", { field: e.target.value })
}

                className="flex-1 min-w-[120px] bg-gray-700 text-white rounded px-2 py-1"
                disabled={!datatype}
              >
                <option value="">Field</option>
                {fields.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>

              {/* OPERATOR */}
              <select
                value={c.operator}
onChange={(e) =>
  updateCondition(i, "operator", e.target.value)
}

                className="flex-1 min-w-[120px] bg-gray-700 text-white rounded px-2 py-1"
                disabled={!c.left.field}


              >
                <option value="">Operator</option>
                {getOperatorsForField(c.left.field, fields).map((op) => (

                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>

              {/* RIGHT SIDE */}
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                {/* SOURCE */}
                <select
  value={c.right.source}
  onChange={(e) => {
    const source = e.target.value;

    updateCondition(i, "right", {
      source,
      field: "",
      value: "",
      search: null,
    });

    if (source === "do_search") {
      const rect = e.target.getBoundingClientRect();
      setNestedAnchorRect(rect);
      setNestedSearchIndex(i);
    }
  }}
  className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
  disabled={!c.operator}
>

                  <option value="">Value source</option>
                  <option value="current_user">Current User</option>
                  <option value="static">Static value</option>
                  <option value="do_search">Do a search for</option>
                  <option value="page_element">Current Page Element</option> {/* new */}

                </select>

                {/* CURRENT USER FIELD */}
{c.right.source === "current_user" && (

                  <select
                    value={c.right.field}
onChange={(e) =>
  updateCondition(i, "right", {
    ...c.right,
    field: e.target.value,
  })
}

                    className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
                  >
                    <option value="">User field</option>
                    {getFieldsForSource("current_user").map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* STATIC VALUE */}
{c.right.source === "static" && (
  <input
    value={c.right.value}
onChange={(e) =>
  updateCondition(i, "right", {
    ...c.right,
    value: e.target.value,
  })
}

    placeholder="Enter value"
    className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
  />
)}


{c.right.source === "do_search" && (
  <button
    className="bg-gray-600 text-white rounded px-2 py-1 text-xs"
    onClick={(e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setNestedAnchorRect(rect);
      setNestedSearchIndex(i);
    }}
  >
    Configure search…
  </button>
)}

{/* PAGE ELEMENT */}
{c.right.source === "page_element" && (
  <>
    <select
      value={c.right.field}
      onChange={(e) =>
        updateCondition(i, "right", {
          ...c.right,
          field: e.target.value,
        })
      }
      className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
    >
      <option value="">Select page element</option>
      {pageElements
        .filter(el => ["input", "search", "dropdown"].includes(el.type))
        .map((el) => (
          <option key={el.id} value={el.id}>
            {el.name || el.type} ({el.id})
          </option>
        ))}
    </select>

    {/* NEW DROPDOWN: value/text of selected page element */}
    {c.right.field && (
      <select
        value={c.right.property || "select"} // default to 'value'
        onChange={(e) =>
          updateCondition(i, "right", {
            ...c.right,
            property: e.target.value,
          })
        }
        className="bg-gray-600 text-white rounded px-2 py-1 text-xs mt-1"
      >
        <option value="select">Select</option>
        <option value="value">Value</option>
      </select>
    )}
  </>
)}




              </div>
            </div>
          ))}
        </div>

        {/* ADD CONDITION */}
        <button
          className="w-full mt-2 bg-gray-700 text-white py-1 rounded hover:bg-gray-600"
          onClick={addCondition}
          disabled={!datatype}
        >
          + Add a new condition
        </button>


        {/* ACTIONS */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            onClick={() =>
              onConfirm({
                mode: "search",
    type: datatype,
                conditions,
                modifier,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
      <DoSearchExpressionPopup
  isOpen={nestedSearchIndex !== null}
  datatypes={datatypes}
  anchorRect={nestedAnchorRect}
  initialValue={
    nestedSearchIndex !== null
      ? conditions[nestedSearchIndex]?.right?.search
      : null
  }
  onClose={() => setNestedSearchIndex(null)}
  onConfirm={(searchExpression) => {
    updateCondition(nestedSearchIndex, "right", {
      ...conditions[nestedSearchIndex].right,
      search: searchExpression,
    });
    setNestedSearchIndex(null);
  }}
/>

    </PopupPortal>
  );
}
