import React, { useState, useEffect, useRef } from "react";

export default function CanvasConditionalPanel({
  selectedElement,
  canvasTree,
    updateElementProperty,

}) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);

  const [source, setSource] = useState(null);
  const [operator, setOperator] = useState(null);
const [operatorType, setOperatorType] = useState(null); 
  const ref = useRef(null);

    // Reset operator when source changes
useEffect(() => {
  setOperator(null);
  setOperatorType(null);
}, [source]);

// Reset everything when selected element changes
useEffect(() => {
  setSource(null);
  setOperator(null);
  setOperatorType(null);
  setSourceOpen(false);
  setOperatorOpen(false);
}, [selectedElement?.id]);


  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setSourceOpen(false);
        setOperatorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);



  const saveCondition = (patch) => {
  updateElementProperty(selectedElement.id, "conditional", {
    ...(selectedElement.conditional || {}),
    ...patch,
  });
};

useEffect(() => {
  const condition = selectedElement?.conditional;
  if (!condition) return;

  setSource(condition.source ?? null);

  if (condition.operator) {
    setOperator({
      label: condition.operator.replace(/_/g, " "),
      value: condition.operator,
    });
  } else {
  }

  setOperatorType(condition.field ? "field" : "standalone");
}, [selectedElement?.id]);


  const SOURCES = [
    { label: `This element (${selectedElement.type})`, value: "element" },
    { label: "Parent group's user", value: "parent_user" },
    { label: "Current user", value: "current_user" },
    { label: "Custom text", value: "custom_text" },
  ];

  const OPERATORS = {
  current_user: {
    operators: [
      { label: "is", value: "is" },
      { label: "is not", value: "is_not" },
    ],
    fields: [
      { label: "Name", value: "name" },
      { label: "Email", value: "email" },
      { label: "Role", value: "role" },
      { label: "Status", value: "status" },
    ],
    standalone: [
      { label: "is logged in", value: "logged_in" },
      { label: "is logged out", value: "logged_out" },
      { label: "is empty", value: "is_empty" },
      { label: "is not empty", value: "not_empty" },
    ],
  },

  element: {
    standalone: [
      { label: "is empty", value: "is_empty" },
      { label: "is not empty", value: "not_empty" },
    ],
  },
};

  return (
    <div ref={ref} className="space-y-3 text-sm">

      <label className="block text-xs font-medium text-gray-700">
        When to display
      </label>

      <div className="flex items-center gap-2">

        {/* SOURCE DROPDOWN */}
        <div className="relative">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setSourceOpen(!sourceOpen);
              setOperatorOpen(false);
            }}
            className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 min-w-[160px] text-left"
          >
            {source
              ? SOURCES.find(s => s.value === source)?.label
              : "Choose source"}
          </button>

          {sourceOpen && (
            <div className="absolute z-50 mt-1 w-56 bg-white border rounded-md shadow">
              {SOURCES.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    setSource(opt.value);
saveCondition({ source: opt.value });

                    setSourceOpen(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OPERATOR DROPDOWN */}
       {/* OPERATOR DROPDOWN */}
{source && OPERATORS[source] && (
  <div className="relative">
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setOperatorOpen(!operatorOpen)}
      className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 min-w-[180px] text-left"
    >
      {operator
        ? operator.label
        : "Choose condition"}
    </button>

    {operatorOpen && (
      <div className="absolute z-50 mt-1 w-64 bg-white border rounded-md shadow text-sm">

        {/* OPERATORS */}
        {OPERATORS[source].operators && (
          <>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase">
              Operators
            </div>
            {OPERATORS[source].operators.map(op => (
              <div
                key={op.value}
                onClick={() => {
                  setOperator(op);
                  setOperatorType("field");
                  setOperatorOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {op.label}
              </div>
            ))}
          </>
        )}

        {/* FIELDS */}
        {OPERATORS[source].fields && (
          <>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase border-t">
              Fields
            </div>
            {OPERATORS[source].fields.map(field => (
              <div
                key={field.value}
                onClick={() => {
  setOperator(field);
  setOperatorType("field");
  saveCondition({ field: field.value });
  setOperatorOpen(false);
}}

                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {field.label}
              </div>
            ))}
          </>
        )}

        {/* STANDALONE */}
        {OPERATORS[source].standalone && (
          <>
            <div className="px-3 py-1 text-xs text-gray-400 uppercase border-t">
              Other
            </div>
            {OPERATORS[source].standalone.map(op => (
              <div
                key={op.value}
                onClick={() => {
  setOperator(op);
  setOperatorType("standalone");
  saveCondition({ operator: op.value, field: null });
  setOperatorOpen(false);
}}

                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {op.label}
              </div>
            ))}
          </>
        )}
      </div>
    )}
  </div>
)}

      </div>

      {/* PREVIEW */}
      {source && operator && (
  <div className="text-xs text-gray-500">
    Rule:{" "}
    <strong>
      {SOURCES.find(s => s.value === source)?.label}
    </strong>{" "}
    <strong>{operator.label}</strong>
  </div>
)}

    </div>
  );
}
