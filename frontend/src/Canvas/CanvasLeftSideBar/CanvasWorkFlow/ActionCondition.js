import React, { useState, useRef, useEffect } from "react";

export default function ActionCondition({
  workflow,
  workflowIndex,
  action,
  actionIndex,
  updateWorkflow,
  pageFields = [],
}) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [step, setStep] = useState("field"); // field | operator | value
  const [selectedField, setSelectedField] = useState(null);
const [selectedValue, setSelectedValue] = useState(null); 
const [selectedOperator, setSelectedOperator] = useState(null);
const [elementValueSelected, setElementValueSelected] = useState(false);

  const dropdownRef = useRef(null);

const ALLOWED_ELEMENT_TYPES = [
  "input",
  "dropdown",
  "filter",
  "select",
  "checkbox",
];
const ELEMENT_TYPES = ["input", "dropdown", "select", "checkbox", "filter"];
const updateActionConditions = (newConditions) => {
  const updatedActions = workflow.actions.map((a, i) =>
    i === actionIndex ? { ...a, conditions: newConditions } : a
  );

  updateWorkflow(workflowIndex, {
    ...workflow,
    actions: updatedActions,
  });
};

const fieldGroups = [
  {
    title: "Data Sources",
    items: pageFields.filter(
      f => f.type === "current_user" || f.type === "search"
    ),
  },
  {
    title: "Elements",
    items: pageFields.filter(
      f =>
        f.type === "element" &&
        ELEMENT_TYPES.includes(f.elementType)
    ),
  },
];




const USER_OPERATORS = [
  { id: "is", label: "is" },
  { id: "is_not", label: "is not" },
];

const UNARY_OPERATORS = [
  "is empty",
  "is not empty",
  "is logged in",
  "is logged out",
];

const getOperatorsForValue = () => {
  if (!selectedValue) return [];

  // CURRENT USER
  if (selectedValue.source === "current_user") {
    return [
             { id: "is", label: "is", unary: false },
      { id: "is_not", label: "is not", unary: false },
     ];
  }

  if (selectedValue.datatype === "text") {
    return [
      { id: "is_empty", label: "is empty", unary: true },
      { id: "is_not_empty", label: "is not empty", unary: true },
      { id: "contains", label: "contains", unary: false },
      { id: "not_contains", label: "doesn't contain", unary: false },
    ];
  }

  if (selectedValue.datatype === "boolean") {
    return [
      { id: "is", label: "is", unary: false },
      { id: "is_not", label: "is not", unary: false },
    ];
  }

  return [];
};

const CURRENT_USER_VALUE_OPERATORS = [
  { id: "is_empty", label: "is empty", unary: true },
  { id: "is_not_empty", label: "is not empty", unary: true },
];

const USER_OTHER_OPERATORS = [
       { id: "is_empty", label: "is empty", unary: true },
      { id: "is_not_empty", label: "is not empty", unary: true },
   
    { id: "is_logged_in", label: "is logged in", unary: true },
      { id: "is_logged_out", label: "is logged out", unary: true },
 

];

const getBreadcrumbs = () => {
  const crumbs = [];

  if (selectedValue?.source === "current_user") {
    crumbs.push("Current User");

    if (selectedField?.type === "user_field" && selectedField.displayName) {
      crumbs.push(selectedField.displayName);
    }
  } else if (selectedField?.displayName) {
    crumbs.push(selectedField.displayName);
  }

  // Add "'s value" for element fields when step is value
  if (selectedValue?.source === "element" && step === "value") {
    crumbs.push("'s value");
  }

  if (selectedOperator?.label) {
    crumbs.push(selectedOperator.label);
  }

  return crumbs;
};





  const UNARY_OPERATOR_IDS = USER_OTHER_OPERATORS.map(o => o.id);

  const resetDropdown = () => {
    setOpenDropdown(false);
    setStep("field");
    setSelectedField(null);
    setSelectedOperator(null);
  };

  /* ---------------- FIELD ---------------- */
const handleFieldClick = (field) => {
  setSelectedField(field);
  setSelectedValue(null);

  // CURRENT USER
  if (field.type === "current_user") {
    setSelectedValue({
      source: "current_user",
      datatype: "user",
    });
    setStep("operator"); // ✅ go to operator
    return;
  }

  // ELEMENT → VALUE IS IMPLICIT
if (field.type === "element" && ELEMENT_TYPES.includes(field.elementType)) {
  setSelectedValue({
    source: "element",
    field: field.id,
    datatype: field.inputType || "text",
  });
  setElementValueSelected(false); // reset intermediate step
  setStep("value_source"); // show 's value' step first
  return;
}

};


const isCurrentUserEquality =
  selectedValue?.source === "current_user" &&
  ["is", "is_not"].includes(selectedOperator?.id);



  /* ---------------- OPERATOR ---------------- */

const handleOperatorClick = (op) => {
  setSelectedOperator(op);

  // ✅ CURRENT USER + IS / IS NOT → GO TO SEARCH ONLY
  if (
    selectedValue?.source === "current_user" &&
    ["is", "is_not"].includes(op.id)
  ) {
    setStep("search");
    return;
  }

  if (op.unary) {
    updateActionConditions([
      ...(action.conditions || []),
      {
        field: null,
        displayName: "Current User",
        operator: op.label,
        value: null,
        source: "current_user",
      },
    ]);
    resetDropdown();
    return;
  }

  setStep("value");
};

  /* ---------------- VALUE ---------------- */

const handleUserFieldClick = (field) => {
  // 👇 THIS IS THE KEY FIX
  setSelectedField(field);

  setSelectedValue({
    source: "current_user",
    field: field.id,
    datatype: field.datatype || "text",
  });

  setStep("value");

};




  /* ---------------- OUTSIDE CLICK ---------------- */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        resetDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
  <div
  ref={dropdownRef}
  className="relative mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs flex flex-col gap-2"
>

  {/* Title */}
      <div className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
  Only When (Action Condition)
</div>


      {/* Existing conditions */}
<div className="flex flex-wrap gap-2 pt12">
  {(action.conditions || []).map((cond, idx) => (
    <div
      key={idx}
      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
    >
      <span className="font-medium">{cond.displayName}</span>
      <span>{cond.operator}</span>
      {cond.value && <span>{cond.value}</span>}
      <button
        onClick={() => {
          const updated = (action.conditions || []).filter((_, i) => i !== idx);
          updateActionConditions(updated);
        }}
        className="ml-1 text-blue-600 hover:text-red-600 font-bold"
      >
        ×
      </button>
    </div>
  ))}

  {/* ✅ SINGLE ADD BUTTON */}
  <button
    onClick={() => {
      setStep("field");
      setSelectedField(null);
      setSelectedValue(null);
      setSelectedOperator(null);
      setOpenDropdown(true);
    }}
    className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700"
  >
    + Add
  </button>
</div>

    {/* Dropdown */}
      {openDropdown && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto text-sm">
          {/* Breadcrumb pills (Bubble style) */}
{getBreadcrumbs().length > 0 && (
  <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200">
    {getBreadcrumbs().map((crumb, idx) => (
      <span
        key={idx}
        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
      >
        {crumb}
        <button
          onClick={() => {
            if (idx === 0) {
              // Remove first step
              setSelectedValue(null);
              setSelectedField(null);
              setSelectedOperator(null);
              setStep("field");
            } else if (idx === 1) {
              // Remove second step
              setSelectedField(null);
              setSelectedOperator(null);
if (selectedValue?.source === "current_user") {
  setStep("operator");
} else if (selectedValue?.source === "element") {
  setStep("value");
} else {
  setStep("field");
}
            } else if (idx === 2) {
              // Remove operator
              setSelectedOperator(null);
              setStep(selectedField?.type === "user_field" ? "value" : "operator");
            }
          }}
         className=" text-gray-400 hover:text-red-500"
        >
          ×
        </button>
      </span>
    ))}
  </div>
)}


{/* STEP 1: FIELD */}
{/* STEP 1: FIELD */}
{step === "field" && (
  <>
    {fieldGroups.map(group =>
      group.items.length ? (
        <div key={group.title}>
          <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
            {group.title}
          </div>
          {group.items.map(f => (
            <div
              key={f.id}
              onClick={() => handleFieldClick(f)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
            >
              <span>{f.displayName}</span>
            </div>
          ))}
        </div>
      ) : null
    )}
  </>
)}
{/* STEP: SEARCH (ONLY FOR CURRENT USER IS / IS NOT) */}
{step === "search" && (
  <>
    <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
      Value
    </div>

    <div
      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
      onClick={() => {
        updateActionConditions([
          ...(action.conditions || []),
          {
            field: null,
            displayName: "Current User",
            operator: selectedOperator.label,
            value: "Do a search for",
            source: "current_user",
          },
        ]);
        resetDropdown();
      }}
    >
      Do a search for
    </div>
  </>
)}


{/* STEP 2: 's value' placeholder */}
{step === "value_source" && selectedValue?.source === "element" && (
  <div
    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
    onClick={() => setStep("value")}
  >
    's value
  </div>
)}
{step === "value" && selectedValue?.source === "current_user" && (
  <>
    <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
      Condition
    </div>
    {CURRENT_USER_VALUE_OPERATORS.map(op => (
      <div
        key={op.id}
        onClick={() =>
          handleOperatorClick({ ...op, unary: true })
        }
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        {op.label}
      </div>
    ))}
  </>
)}

          {/* STEP 2: OPERATOR */}
          {/* STEP 2: OPERATOR */}
{step === "operator" && (
  <>
    {/* Operators */}
    <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
      Operators
    </div>

    {getOperatorsForValue().map(op => (
      <div
        key={op.id}
        onClick={() => handleOperatorClick(op)}
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        {op.label}
      </div>
    ))}

    {/* Other Operators */}
    <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
      Other
    </div>

    {USER_OTHER_OPERATORS.map(op => (
      <div
        key={op.id}
        onClick={() => handleOperatorClick(op)}
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        {op.label}
      </div>
    ))}

    {/* ✅ USER FIELDS – SHOWN IMMEDIATELY */}
    {selectedValue?.source === "current_user" && (
      <>
        <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
          User Fields
        </div>

        {pageFields
          .filter(f => f.type === "user_field")
          .map(f => (
            <div
              key={f.id}
              onClick={() => handleUserFieldClick(f)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {f.displayName}
            </div>
          ))}
      </>
    )}
  </>
)}

{/* STEP 3: VALUE */}
{step === "value" && selectedValue && (
  <>
    <div className="px-3 py-1 text-gray-400 uppercase font-semibold text-[10px]">
      Condition
    </div>

    {selectedValue.source === "current_user" &&
      CURRENT_USER_VALUE_OPERATORS.map(op => (
        <div
          key={op.id}
          onClick={() => handleOperatorClick({ ...op, unary: true })}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {op.label}
        </div>
      ))}

    {selectedValue.source === "element" &&
      ["is empty", "is not empty"].map(opLabel => (
        <div
          key={opLabel}
          onClick={() => {
            updateActionConditions([
  ...(action.conditions || []),
  {
    field: selectedField.id,
    displayName: `${selectedField.displayName}'s value`,
    operator: opLabel,
    value: null,
    source: selectedValue.source,
  },
]);

            resetDropdown();
          }}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
        >
          {opLabel}
        </div>
      ))}
  </>
)}


     </div>
      )}
    </div>
  );
}
