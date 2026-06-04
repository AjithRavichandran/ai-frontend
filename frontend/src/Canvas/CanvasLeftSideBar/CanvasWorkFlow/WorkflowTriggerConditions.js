import React, { useState, useRef, useEffect } from "react";
import { getOperatorsForField } from "../../CanvasProperties/CanvasOperator";

export default function WorkflowConditions({
  wf,
  updateWorkflow,
  workflowIndex,
  addCondition,
  availableFields = [],
  datatypes = [],
}) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);
// field | operator | user_field | user_field_operator
const [step, setStep] = useState("field"); // field | current_user_matrix | user_field_operator
const [selectedField, setSelectedField] = useState(null);
const [selectedUserField, setSelectedUserField] = useState(null);
const [selectedOperator, setSelectedOperator] = useState(null);
const [selectedValue, setSelectedValue] = useState(null);
// field | user_field | operator
const ALLOWED_ELEMENT_TYPES = [
  "input",
  "dropdown",
  "filter",
  "select",
  "checkbox",
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

const getOperatorsForSelectedInput = () => {
  if (!selectedField) return [];

  // For text, email, password inputs
  if (selectedField.elementType === "input") {
    switch (selectedField.inputType) {
      case "email":
      case "password":
        return ["is empty", "is not empty", "is valid", "is not valid"];
      case "text":
      default:
        return ["is empty", "is not empty"];
    }
  }

  // For checkbox inputs
  if (selectedField.elementType === "checkbox") {
    return ["is checked", "is not checked"];
  }

  // For dropdown/select inputs
  if (selectedField.elementType === "dropdown" || selectedField.elementType === "select") {
    return ["is", "is not"];
  }

  // Default fallback
  return ["is empty", "is not empty"];
};


const USER_OTHER_OPERATORS = [
  { id: "is_logged_in", label: "is logged in" },
  { id: "is_logged_out", label: "is logged out" },
  { id: "is_empty", label: "is empty" },
  { id: "is_not_empty", label: "is not empty" },
];


const handleFieldClick = (field) => {
  // RHS value for current user comparison
  if (selectedOperator && selectedField?.type === "current_user") {
    updateWorkflow(workflowIndex, {
      ...wf,
      conditions: [
        ...wf.conditions,
        {
          field: selectedField.id, // current_user
          displayName: `${selectedField.displayName} ${selectedOperator.label} ${field.displayName}`,
          operator: selectedOperator.label,
          value: field.id,
          type: "current_user",
        },
      ],
    });

    resetDropdown();
    return;
  }

  // existing logic
  if (field.type === "current_user") {
    setSelectedField(field);
    setStep("current_user_matrix");
    return;
  }

  if (ALLOWED_ELEMENT_TYPES.includes(field.elementType)) {
    setSelectedField(field);
    setStep("value_source");
    return;
  }
};

const isUserComparison =
  selectedField?.type === "current_user" &&
  ["is", "is_not"].includes(selectedOperator?.id);


const handleOperatorClick = (op) => {
  setSelectedOperator(op);

  // OTHER OPERATORS → finalize immediately
  if (
    ["is_logged_in", "is_logged_out", "is_empty", "is_not_empty"].includes(op.id)
  ) {
    updateWorkflow(workflowIndex, {
      ...wf,
      conditions: [
        ...wf.conditions,
        {
          field: selectedField.id,
          displayName: selectedField.displayName,
          operator: op.label,
          value: null,
          type: "current_user",
        },
      ],
    });

    resetDropdown();
    return;
  }

  // ✅ USER OPERATORS → go back to field selection
  if (["is", "is_not"].includes(op.id)) {
    setStep("field"); // 🔥 show Do a search / Current user / Elements again
  }
};




const handleUserFieldClick = (field) => {
  setSelectedValue(field);
  setStep("user_field_operator");
};


const resetDropdown = () => {
  setOpenDropdown(false);
  setStep("field");
  setSelectedField(null);
  setSelectedOperator(null);
  setSelectedValue(null);
};
const handleUserFieldOperatorClick = (op) => {
  updateWorkflow(workflowIndex, {
    ...wf,
    conditions: [
      ...wf.conditions,
      {
        field: selectedField.id, // current_user
        displayName: `${selectedField.displayName}.${selectedValue.label}`,
        operator: op.label,
        value: selectedValue.id,
        type: "current_user",
      },
    ],
  });

  resetDropdown();
};

const currentUserType = datatypes.find(d => d.name === "users");

const currentUserFields = currentUserType
  ? currentUserType.fields.map(field => ({
      id: field.name,
      label: field.name.replace(/([A-Z])/g, " $1"),
      type: field.type,
      cardinality: field.cardinality,
      relation: field.relation || null,
    }))
  : [];

  const handleAddCondition = (field) => {
    const operators = getOperatorsForField(field.id, availableFields);
    const newCond = {
      field: field.id,
      displayName: field.displayName,
      operator: operators[0]?.value || "",
      value: "",
      type: field.type,
    };

    updateWorkflow(workflowIndex, {
      ...wf,
      conditions: [...wf.conditions, newCond],
    });

    setOpenDropdown(false);
  };

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const groups = [
  {
    title: "Data Sources",
    items: availableFields.filter((f) => {
      if (isUserComparison) {
        // ✅ ONLY Do a search
        return f.type === "search";
      }
      return f.type === "current_user" || f.type === "search";
    }),
  },

  // ❌ Hide Elements completely during user comparison
  ...(!isUserComparison
    ? [
        {
          title: "Elements",
          items: availableFields.filter(
            (f) =>
              f.type === "element" &&
              ALLOWED_ELEMENT_TYPES.includes(f.elementType)
          ),
        },
      ]
    : []),
];

  return (
    <div className="section-card">
      <div className="section-title">Only When (Trigger Condition)</div>

      <div className="flex flex-wrap gap-2">
        {/* Existing conditions */}
        {wf.conditions.map((cond, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
          >
            <span className="font-medium">
  {cond.displayName}
</span>

<span className="text-gray-500">
  {cond.operator}
</span>

{cond.value &&
  !UNARY_OPERATORS.includes(cond.operator) && (
    <span className="text-gray-700">
      {cond.value}
    </span>
)}

            <button
              onClick={() => {
                const updated = wf.conditions.filter((_, i) => i !== idx);
                updateWorkflow(workflowIndex, {
                  ...wf,
                  conditions: updated,
                });
              }}
              className="ml-2 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add condition */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenDropdown((v) => !v)}
            className="text-blue-600 text-sm px-3 py-1 border border-blue-200 rounded-full hover:bg-blue-50"
          >
            + Add Condition
          </button>

{openDropdown && (
  <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
    {/* Breadcrumb pills (Bubble style) */}
{(selectedField || selectedOperator) && (
  <div className="flex gap-2 px-3 pt-3 pb-2 flex-wrap border-b">
    {selectedField && (
      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        {selectedField.displayName}
        <button
          onClick={() => {
            setSelectedField(null);
            setSelectedOperator(null);
            setStep("field");
          }}
          className="hover:text-red-500"
        >
          ✕
        </button>
      </span>
    )}

    {selectedOperator && (
      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
        {selectedOperator.label}
        <button
          onClick={() => {
            setSelectedOperator(null);
            setStep("current_user_matrix");
          }}
          className="hover:text-red-500"
        >
          ✕
        </button>
      </span>
    )}
  </div>
)}

{step === "current_user_matrix" && selectedOperator && (
  <>
    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
      User fields
    </div>

    {currentUserFields.map((f) => (
      <div
        key={f.id}
        onClick={() => handleUserFieldClick(f)}
        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
      >
        {f.label}
      </div>
    ))}
  </>
)}

    {/* Step 1: Select Field */}
    {step === "field" && groups.map((group) => {
      if (!group.items.length) return null;

      return (
        <div key={group.title} className="py-2">
          <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
            {group.title}
          </div>

          {group.items.map((f) => (
            <div
              key={f.id}
              onClick={() => handleFieldClick(f)}
              className="px-4 py-2 text-sm cursor-pointer flex justify-between items-center hover:bg-gray-100"
            >
              <span>{f.displayName}</span>
              {f.elementType && (
                <span className="text-xs text-gray-400">{f.elementType}</span>
              )}
            </div>
          ))}
        </div>
      );
    })}
{step === "value_source" && (
  <>
    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
      Value
    </div>

    <div
      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
      onClick={() => setStep("value_operator")}
    >
      's value
    </div>
  </>
)}

   {step === "value_operator" && (
  <>
    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
      Operators
    </div>

    {getOperatorsForSelectedInput().map((op) => (
      <div
        key={op}
        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
        onClick={() => {
          // finalize condition
          updateWorkflow(workflowIndex, {
            ...wf,
            conditions: [
              ...wf.conditions,
              {
  type: "element",
  field: selectedField.id,
  displayName: `${selectedField.displayName}'s value`,
  operator: op,
  value: UNARY_OPERATORS.includes(op) ? null : "",
}

            ],
          });
          resetDropdown();
        }}
      >
        {op}
      </div>
    ))}
  </>
)}
 
{step === "current_user_matrix" && (
  <div className="grid grid-cols-3 gap-4 px-3 py-2">
    
    {/* USER OPERATORS */}
    <div>
      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
        User operators
      </div>
      {USER_OPERATORS.map((op) => (
        <div
          key={op.id}
          onClick={() => handleOperatorClick(op)}
          className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          {op.label}
        </div>
      ))}
    </div>

    {/* OTHER OPERATORS */}
    <div>
      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
        Other operators
      </div>
      {USER_OTHER_OPERATORS.map((op) => (
        <div
          key={op.id}
          onClick={() => handleOperatorClick(op)}
          className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          {op.label}
        </div>
      ))}
    </div>

    {/* USER FIELDS */}
    <div>
      <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
        User fields
      </div>
      {currentUserFields.map((f) => (
        <div
          key={f.id}
          onClick={() => handleUserFieldClick(f)}
          className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 rounded"
        >
          {f.label}
        </div>
      ))}
    </div>

  </div>
)}


{step === "user_field_operator" && (
  <>
    <div className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">
      Operators
    </div>

    {getOperatorsForSelectedInput().map((op) => (
      <div
        key={op}
        onClick={() => handleUserFieldOperatorClick({ label: op })}
        className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
      >
        {op}
      </div>
    ))}
  </>
)}

  
    
  </div>
)}

        </div>
      </div>
    </div>
  );
}
