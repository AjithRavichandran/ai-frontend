// src/DynamicExpressionBuilder.js
import React, { useState, useEffect } from "react";
import { findNodeAndParent } from "../utils/CanvastreeUtils";
import PopupPortal from "./PopupPortal";
import { getOperatorsForField } from "./CanvasOperator";
import CurrentUserFieldPopup from "./CurrentUserFieldPopup";
import DoSearchEditor from "./DoSearchEditorDynamicExpressionBuilder";


export default function DynamicExpressionBuilder({
  selectedElement,
  datatypes,
  updateElementProperty,
  canvasTree,
}) {
  const [expression, setExpression] = useState([]);
  const [waitingForField, setWaitingForField] = useState(false);
  const [tryingParentGroup, setTryingParentGroup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [conditions, setConditions] = useState([]);
const [popupSelectedType, setPopupSelectedType] = useState("");
const [showModifierAlert, setShowModifierAlert] = useState(false);
const [showModifierDropdown, setShowModifierDropdown] = useState(false);
const [showCurrentUserPopup, setShowCurrentUserPopup] = useState(false);
const [nestedSearch, setNestedSearch] = useState(null);
useEffect(() => {
  const temp = selectedElement?.dynamicDataPopupTemp;
  const saved = selectedElement?.dynamicDataPopup;
  const expr = selectedElement?.dynamicData;

  setExpression(expr ? expr.split(".") : []);

  if (temp) {
    setPopupSelectedType(temp.popupType);
    setConditions(temp.conditions);
    return;
  }

  if (saved) {
    setPopupSelectedType(saved.popupType);
    setConditions(saved.conditions);
    return;
  }

  // 👉 Only clear if this is a NEW element AND popup is closed
  if (!showPopup) {
    setPopupSelectedType("");
    setConditions([]);
  }
}, [selectedElement?.id]);

const numberOperators = [
  { label: "+", value: "+" },
  { label: "-", value: "-" },
  { label: "*", value: "*" },
  { label: "/", value: "/" },
  { label: "Round", value: "round" },
  { label: "Floor", value: "floor" },
  { label: "Ceiling", value: "ceiling" },
];
  const fields =
  datatypes.find((dt) => dt.name === popupSelectedType)?.fields || [];

const selectedFieldName = expression[3];
const selectedFieldMeta =
  fields.find(f => f.name === selectedFieldName);

const isNumberField = selectedFieldMeta?.type === "number";

const numberEachItemModifiers = [
  { label: "First item", value: "first-item" },
  { label: "Last item", value: "last-item" },
  { label: "Random item", value: "random-item" },
  { label: "Sum", value: "sum" },
  { label: "Product", value: "product" },
  { label: "Average", value: "average" },
  { label: "Median", value: "median" },
  { label: "Min", value: "min" },
  { label: "Max", value: "max" },
];


const stopPropagation = (e) => e.stopPropagation();

  useEffect(() => {
  if (!showPopup) return;

  const trigger = document.getElementById("do-search-trigger");
  if (!trigger) return;

  const updatePopupPosition = () => {
    const rect = trigger.getBoundingClientRect();
    setPopupPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  };

  updatePopupPosition();
  window.addEventListener("scroll", updatePopupPosition);
  window.addEventListener("resize", updatePopupPosition);

  return () => {
    window.removeEventListener("scroll", updatePopupPosition);
    window.removeEventListener("resize", updatePopupPosition);
  };
}, [showPopup]);

  
  // Find nearest parent with typeOfContent
  const getParentContainer = () => {
    if (!canvasTree || !selectedElement?.id) return null;
    let current = findNodeAndParent(canvasTree, selectedElement.id)?.parent;
    while (current) {
      if (current.typeOfContent) return current;
      current = findNodeAndParent(canvasTree, current.id)?.parent;
    }
    return null;
  };
const getActiveSearchIndex = () => {
  for (let i = expression.length - 1; i >= 0; i--) {
    if (expression[i] === "search_for") {
      return i;
    }
  }
  return -1;
};
const activeSearchIndex = getActiveSearchIndex();


  const parentContainer = getParentContainer();
  const parentType = parentContainer?.typeOfContent || null;
  const parentFields = parentType
    ? datatypes.find((dt) => dt.name === parentType)?.fields || []
    : [];

const showParentGroupWarning =
  tryingParentGroup || 
  (expression.includes("parent_group") && (!parentContainer?.typeOfContent || !parentContainer?.dataSource));

  const sources = [
    { label: "Current User", value: "current_user" },
    { label: `Parent Group's ${parentType || "Datatype"}`, value: "parent_group" },
    { label: "Do a Search for…", value: "search_for" },
  ];

  // Combine fixed modifiers + each-item fields dynamically
const getCombinedModifiers = () => {
  if (!searchType) return searchModifiers; // fallback
  const dt = datatypes.find(d => d.name === searchType);
  if (!dt) return searchModifiers;

  const eachItemFields = dt.fields.map(f => ({
    label: `Each item's ${f.name}`,
    value: `each-item.${f.name}`,
    type: "field",
  }));

  return [
    { label: "--- Modifier ---", value: null, type: "heading" },
    ...searchModifiers.filter(m => m.value !== "each-item"), // only fixed modifiers
    { label: "--- Fields ---", value: null, type: "heading" },
    ...eachItemFields
  ];
};

  const searchModifiers = [
  { label: "First item", value: "first-item" },
  { label: "Last item", value: "last-item" },
  { label: "Random", value: "random-item" },
];
const aggregationOperators = [
  { label: "Sum", value: "sum" },
  { label: "Count", value: "count" },
  { label: "Average", value: "average" },
];
const canAggregate =
  expression.includes("*") &&
  typeof expression.at(-1) === "string" &&
  !["sum", "count", "average"].includes(expression.at(-1));


  useEffect(() => {
  if (!selectedElement) return;

  updateElementProperty(selectedElement.id, "dynamicDataPopupTemp", {
    popupType: popupSelectedType,
    conditions: conditions,
  });
}, [popupSelectedType, conditions]);


const updateExpression = (newParts) => {
  setExpression(newParts);

  const serialized = serializeExpressionForBackend(newParts);

  updateElementProperty(
    selectedElement.id,
    "dynamicData",
    serialized
  );
};


  const addPart = (value, triggerId = null) => {
    if (value === "parent_group") {
      setTryingParentGroup(true);
      if (!parentContainer?.typeOfContent || !parentContainer?.dataSource) return;
    }
    setTryingParentGroup(false);

if (value === "search_for") {
  // Open popup
  if (triggerId) {
    const trigger = document.getElementById(triggerId);
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setPopupPosition({ 
        top: rect.bottom + window.scrollY + 4, 
        left: rect.left + window.scrollX 
      });
    }
  }

  setShowPopup(true);

  // Reset type and conditions
  setPopupSelectedType("");
  setConditions((prev) =>
    prev.length ? prev : [{ field: "", operator: "", value: "" }]
  );

  // 👈 Reset modifier dropdown
  setShowModifierDropdown(false);

  // Start expression
  updateExpression([value]);
  return;
}


    updateExpression([...expression, value]);
  };

  const selectParentField = (fieldName) => {
    if (!fieldName) return;
    updateExpression([...expression, fieldName]);
    setWaitingForField(false);
  };

  const modifyPart = (index, value) => {
    const newParts = [...expression];
    newParts[index] = value;
    updateExpression(newParts);
  };

  const removePart = (index, count = 1) => {
  const newParts = expression.filter((_, i) => i < index || i >= index + count);
  updateExpression(newParts);
  setWaitingForField(false);
};


  const currentDatatype = () => {
    if (!waitingForField) return null;
    const last = expression.at(-1);
    return datatypes.find((d) => d.name === last);
  };


  const updateCondition = (index, key, value) => {
    const newConditions = [...conditions];
    newConditions[index][key] = value;
    setConditions(newConditions);
  };

  const addCondition = () => {
  setConditions([
    ...conditions,
    {
      field: "",
      operator: "",
      value: {
        source: "",
        field: "",
        value: "",
        search: null,
      },
    },
  ]);
};


  const currentUserFields =
  datatypes.find((dt) => dt.name === "users")?.fields || [];
const base = activeSearchIndex;

const searchType     = expression[base + 1];
const searchModifier = expression[base + 2];
const searchField    = expression[base + 3];
const searchOperator = expression[base + 4];

const isEachItem = expression[base + 2] === "*";
const eachItemField = expression[base + 3];
const eachItemFieldMeta =
  datatypes
    .find(dt => dt.name === searchType)
    ?.fields.find(f => f.name === eachItemField);

const isEachItemNumber = eachItemFieldMeta?.type === "number";
const hasEachItemAggregation =
  isEachItem &&
  typeof searchOperator === "string" &&
  ["sum", "product", "average", "median", "min", "max"].includes(searchOperator);

  const arithmeticOperator =
  isEachItem ? expression[base + 5] : expression[base + 4];

const valuePlaceholderIndex = isEachItem ? base + 6 : base + 5;
const operatorIndex = isEachItem
  ? (hasEachItemAggregation ? base + 5 : null)
  : base + 4;
const valueRequiredOperators = [
  "+",
  "-",
  "*",
  "/",
  "round",
  "floor",
  "ceiling",
];

const canShowValue =
  // normal field with operator
  (!isEachItem && !!searchOperator) ||

  // each-item aggregation
  hasEachItemAggregation ||

  // explicit value placeholder (*)
  expression[valuePlaceholderIndex] === "*";

const waitingForValueSource =
  activeSearchIndex !== -1 &&
  searchField &&
  canShowValue &&
  !expression[valuePlaceholderIndex + 1];


 const isExpressionIncomplete = () => {
  if (!expression.length) return false; // empty = neutral gray

  // current_user incomplete if no field selected
  if (expression[0] === "current_user") {
    return expression.length < 2;
  }

  const base = expression.findIndex(e => e === "search_for");

  if (base !== -1) {
    const type = expression[base + 1];
    const modifier = expression[base + 2];
    const field = expression[base + 3];

    // Each-item: modifier is "*", needs a field
    if (modifier === "*" && !field) return true;

    // Normal search: type selected but no field yet
    if (type && !field && modifier !== "*") return true;
  }

  // parent_group incomplete if no field after it
  const pgIndex = expression.indexOf("parent_group");
  if (pgIndex !== -1 && !expression[pgIndex + 1]) return true;

  return false; // otherwise, expression is complete
};


function serializeExpressionForBackend(expression) {
  const parts = [];

  for (let i = 0; i < expression.length; i++) {
    const item = expression[i];

    // Each item's <field>
    if (item === "*" && expression[i + 1]) {
      parts.push(`each item's ${expression[i + 1]}`);
      i++; // skip field
      continue;
    }

    parts.push(item);
  }

  return parts.join(".");
}

  return (
<div className="space-y-2">
  {/* Single Main Label */}
  <label className="block text-xs font-medium text-gray-700 mb-1">
    Dynamic Data
  </label>

  {/* Expression pills container */}
  <div
  className={`flex flex-wrap gap-2 p-2 border rounded bg-gray-50 min-h-[45px] items-center
${
  isExpressionIncomplete()? "border-red-500": expression.includes("*") ? "border-red-500": expression.length? "border-blue-500": "border-gray-200"}`}>  
 {expression.map((item, index) => {
  let label = item;
  let isEachItem = false;

  // Handle each-item display
  if (item === "*" && expression[index + 1]) {
    label = `Each item's ${expression[index + 1]}`;
    isEachItem = true;
  }

  // Hide the next field pill since it's already shown
  if (index > 0 && expression[index - 1] === "*") {
    return null;
  }

  // Combine current_user with its selected field
  if (item === "current_user" && conditions[0]?.field) {
    label = `Current user: ${conditions[0].field}`;
  }

  // Check if a modifier follows the each-item field
  let modifierValues = ["first-item", "last-item", "random-item"];
  let hasModifierAfter = false;

  if (isEachItem) {
    const nextIndex = index + 2; // * is index, field is index+1, modifier could be index+2
    hasModifierAfter = modifierValues.includes(expression[nextIndex]);
  }

  return (
    <div
      key={index}
      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs cursor-pointer ${
        isEachItem && hasModifierAfter
          ? "bg-blue-100 text-blue-700"
          : isEachItem
          ? "bg-gray-200 text-gray-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      <span>{label}</span>
      <button
        className="text-red-600 ml-1"
        onClick={() => {
          if (item === "*" && expression[index + 1]) {
            const nextItem = expression[index + 2];
            if (modifierValues.includes(nextItem)) {
              removePart(index, 3); // remove *, field, modifier
            } else {
              removePart(index, 2); // remove *, field
            }
          } else {
            removePart(index);
          }
        }}
      >
        ×
      </button>
    </div>
  );
})}


{/* Show + only if expression is empty */}
      {/* Show + only if expression is empty */}
{expression.length === 0 && (
  <DropdownButton
    label="+"
    options={sources}
    onSelect={(value) => {
      if (value === "current_user") {
  setExpression(["current_user"]);
  setTryingParentGroup(false); // reset warning
}
 else {
        addPart(value, "do-search-trigger");
      }
    }}
  />
)}
  </div>


{/* Modifier + Filter row — outside pills container */}
{activeSearchIndex !== -1 && (

  <div className="flex justify-between items-start mt-2 p-2 border rounded bg-gray-50 min-h-[45px]">

    {/* Left side: show Modifier / Field selector only if field not selected */}
    {!searchField && (

      <div className="flex flex-col relative">
        {!searchModifier ? (

          // Show Modifier button if modifier not selected
          <>
            <button
              className="px-2 py-1 bg-gray-200 rounded text-xs"
              onClick={() => {
                if (!expression[1]) {
                  setShowModifierAlert(true);
                  return;
                }
                setShowModifierDropdown((prev) => !prev);
              }}
            >
              {
  expression[2] 
    ? (searchModifiers.find(m => m.value === expression[2])?.label || "Modifier")
    : "Modifier"
}

            </button>

            {/* Alert if no type selected */}
            {showModifierAlert && (
              <div className="text-red-600 text-xs mt-1">
                Please choose the type for 'Do a Search' first by clicking "Filter".
              </div>
            )}

            {/* Modifier dropdown */}
            {showModifierDropdown && (
              <div className="absolute mt-1 bg-white border rounded shadow-md z-10 w-40">
                {searchModifiers.map((mod) => (
                  <div
                    key={mod.value}
                    className="px-3 py-2 hover:bg-gray-100 text-xs cursor-pointer"
                    onClick={() => {
  const newExpr = [...expression];

  if (mod.value === "each-item") {
    // replace modifier with list spread
    newExpr[base + 2] = "*";
    updateExpression(newExpr);
  } else {
    newExpr[base + 2] = mod.value;
    updateExpression(newExpr);
  }

  setShowModifierDropdown(false);
}}

                  >
                    {mod.label}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          // Show Field selector if modifier selected but field not selected
          <DropdownButton
            label="Select Field"
            options={(datatypes.find(dt => dt.name === searchType)?.fields || []).map(f => ({
              label: f.name,
              value: f.name
            }))}
            onSelect={(fieldName) => {
const newExpr = [...expression];
newExpr[base + 3] = fieldName;
updateExpression(newExpr);
              updateExpression(newExpr);
            }}
          />
        )}
      </div>
    )}
{/* STEP 3: Operator (number fields only) */}
{searchField &&
  isNumberField &&
  (
    (!isEachItem && !searchOperator) ||      // normal number field
    (hasEachItemAggregation && !expression[base + 5]) // each-item AFTER aggregation
  ) && (
   <DropdownButton
  label="Operator"
  options={numberOperators}
  onSelect={(op) => {
    const newExpr = [...expression];

    if (isEachItem && hasEachItemAggregation) {
      // each-item → operator after aggregation
      newExpr[base + 5] = op;
    } else {
      // normal field → operator immediately after field
      newExpr[base + 4] = op;
    }

    updateExpression(newExpr);
  }}
/>

)}



  {/* STEP 4: Value source (restart flow) */}
{waitingForValueSource && (
  <DropdownButton
    label="Select Value"
    options={sources}
    onSelect={(value) => {
      if (value === "current_user") {
        updateExpression([...expression, "current_user"]);
      } else if (value === "parent_group") {
        updateExpression([...expression, "parent_group"]);
      } else if (value === "search_for") {
        setShowPopup(true);
        updateExpression([...expression, "search_for"]);
      }
    }}
  />
)}
{showModifierDropdown && (
  <div className="absolute mt-1 bg-white border rounded shadow-md z-10 w-40">
    {getCombinedModifiers().map((mod) => {
      if (mod.type === "heading") {
        return (
          <div key={mod.label} className="px-3 py-1 text-gray-500 text-xs">
            {mod.label}
          </div>
        );
      }
      return (
        <div
          key={mod.value}
          className="px-3 py-2 hover:bg-gray-100 text-xs cursor-pointer"
          onClick={() => {
            const newExpr = [...expression];
            if (mod.value.startsWith("each-item.")) {
              // Each item field selected
              const fieldName = mod.value.split(".")[1];
              newExpr[base + 2] = "*"; // "*" = each-item
              newExpr[base + 3] = fieldName; // field selected
              updateExpression(newExpr);
            } else {
              // Normal modifier
              newExpr[base + 2] = mod.value;
              updateExpression(newExpr);
            }
            setShowModifierDropdown(false);
          }}
        >
          {mod.label}
        </div>
      );
    })}
  </div>
)}
{isEachItem && eachItemField && !hasEachItemAggregation && (
  <DropdownButton
    label="Modifier"
    options={
      isEachItemNumber
        ? numberEachItemModifiers
        : searchModifiers
    }
    onSelect={(mod) => {
      const newExpr = [...expression];
      newExpr[base + 4] = mod;   // 👈 modifier AFTER field
      updateExpression(newExpr);
    }}
  />
)}


    {/* Filter button on the right */}
    <button
      id="filter-open-btn"
      className="px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-700"
      onClick={() => setShowPopup(prev => !prev)}
    >
      Filter
    </button>

    
  </div>
)}


      
      {/* Parent Group warning */}
{showParentGroupWarning && (
  <div className="text-red-600 text-xs mt-2 p-2 border border-red-200 bg-red-50 rounded">
    ⚠ Parent group's type of content or data source is not provided.
  </div>
)}

      {/* Parent Group fields */}
      {expression.at(-1) === "parent_group" && parentFields.length > 0 && (
        <DropdownButton
          label="Select field"
          options={parentFields.map((f) => ({ label: f.name, value: f.name }))}
          onSelect={selectParentField}
        />
      )}

      {expression.at(-1) === "current_user" && !expression[1] && (
  <DropdownButton
    label="Select field"
    options={currentUserFields.map(f => ({ label: f.name, value: f.name }))}
    onSelect={(fieldName) => {
      updateExpression(["current_user", fieldName]);
    }}
  />
)}




      {/* Floating popup for "Do a Search" */}
     {showPopup && (
  <DoSearchEditor
    initialValue={{
      type: popupSelectedType,
      conditions: conditions,
    }}
    datatypes={datatypes}
    anchorRect={{
      top: popupPosition.top,
      left: popupPosition.left,
      bottom: popupPosition.top,
    }}
    onClose={() => setShowPopup(false)}
    onSave={(data) => {
      setPopupSelectedType(data.type);
      setConditions(data.conditions);
      setShowPopup(false);

      setExpression(prev => {
        const newExpr = [...prev];
        const lastIndex = newExpr.lastIndexOf("search_for");

        if (lastIndex !== -1 && !newExpr[lastIndex + 1]) {
          newExpr[lastIndex + 1] = data.type;
        } else {
          newExpr.push("search_for", data.type);
        }

        updateElementProperty(
          selectedElement.id,
          "dynamicData",
          newExpr.join(".")
        );

        return newExpr;
      });
      
    }}
  />
  
)}



      {/* Floating popup for Current User fields */}
<CurrentUserFieldPopup
  isOpen={showCurrentUserPopup}
  anchorRect={popupPosition}
  userFields={currentUserFields}
  selectedField={conditions[0]?.field}
  onClose={() => setShowCurrentUserPopup(false)}
  onSelect={(fieldName) => {
    const newConditions = [...conditions];
    if (newConditions.length === 0) {
      newConditions.push({ field: fieldName, operator: "", value: "" });
    } else {
      newConditions[0].field = fieldName;
    }
    setConditions(newConditions);
    setShowCurrentUserPopup(false);
  }}
/>

    </div>
    
    
  );
}

// Inline dropdown component
function DropdownButton({ label, options, onSelect, disabled, onDisabledClick }) {
  const [open, setOpen] = useState(false);

  const handleButtonClick = () => {
    if (disabled) {
      if (onDisabledClick) onDisabledClick();
      return;
    }
    setOpen(o => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        className={`px-2 py-1 rounded text-xs ${disabled ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200"}`}
        onClick={handleButtonClick}
      >
        {label}
      </button>
      {open && !disabled && (
        <div className="absolute mt-1 bg-white border rounded shadow-md z-10 w-40">
          {options.map(opt => (
            <div
              key={opt.value}
              className="px-3 py-2 hover:bg-gray-100 text-xs cursor-pointer"
              onClick={() => { onSelect(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

