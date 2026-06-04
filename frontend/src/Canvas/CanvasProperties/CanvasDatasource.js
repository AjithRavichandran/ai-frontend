// src/Canvas/CanvasProperties/CanvasDatasource.js

import React, { useState, useEffect } from "react";
import PopupPortal from "./PopupPortal";
import { getOperatorsForField } from "./CanvasOperator";
import DoSearchExpressionPopup from "./DoSearchExpressionPopup";
import { resolveExpressionOutput } from "./resolveExpressionOutput";
import SearchModifierSelector from "./SearchModifierSelector";
import CurrentUserFieldPopup from "./CurrentUserFieldPopup";




export default function DataSourceSelector({
  elementId,
  typeOfContent,
  dataSource,
  datatypes,
  updateElementProperty,
  panelPosition,
  selectedElement,
  canvasTree,
}) {
const expressionResult = resolveExpressionOutput({
  dataSource,
  selectedElement,
  datatypes,
});
const isDropdown = selectedElement?.type === "dropdown";
const selectedDatatype =
  datatypes.find((dt) => dt.name === typeOfContent) || null;

const dropdownFieldModifiers =
  selectedDatatype?.fields?.map((f) => ({
    label: `each item's ${f.name}`,
    value: `each_item.${f.name}`,
  })) || [];
const findScopeForElement = (tree, elementId) => {
  const findInNode = (node) => {
    if (!node) return false;
    if (node.id === elementId) return true;

    if (node.children) {
      return node.children.some(findInNode);
    }
    return false;
  };

  // 1️⃣ Pages
  for (const page of tree?.pages || []) {
    if (page.id === elementId) return page;
    if (findInNode(page)) return page;
  }

  // 2️⃣ Global Popups
  if (tree?.globalPopups?.children) {
    for (const popup of tree.globalPopups.children) {
      if (popup.id === elementId) return tree.globalPopups;
      if (findInNode(popup)) return tree.globalPopups;
    }
  }

  return null;
};


const flattenElements = (nodes = []) => {
  let result = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children?.length) {
      result = result.concat(flattenElements(node.children));
    }
  }
  return result;
};

const currentScope = findScopeForElement(canvasTree, selectedElement?.id);

let scopeElements = [];

// PAGE SCOPE
if (currentScope && currentScope !== canvasTree?.globalPopups) {
  scopeElements = flattenElements(currentScope.children || []);
}

// GLOBAL POPUP SCOPE
if (currentScope === canvasTree?.globalPopups) {
  scopeElements = canvasTree.globalPopups.children
    .filter(p => p.type === "popup") // ✅ ignore overlay_backdrop
    .flatMap(popup => flattenElements(popup.children || []));
}

const pageElements = scopeElements.filter(
  el => el.id !== selectedElement?.id
);

// flatten children of global popups
const globalPopupElements = (canvasTree?.globalPopups?.children || [])
  .filter(p => p.type === "popup") // ignore overlay_backdrop etc
  .flatMap(popup => flattenElements(popup.children || []));

// combine page elements + global popup elements
const allElementsForPopup = [...pageElements, ...globalPopupElements];


const globalPopups = canvasTree?.globalPopups?.children?.filter(p => p.type === "popup") || [];

const dataSourceGroups = [
  {
    heading: "Data source",
    items: [
      { label: "Do a search for", value: "search" },
      { label: "Current user", value: "currentUser" },
    ],
  },
  {
    heading: "Elements",
    items: pageElements.map(el => ({
      label: `${el.name || el.type} (${el.id})`,
      value: `element:${el.id}`,
      elementType: el.type,
    })),
  },
  {
    heading: "Global Popups",
    items: globalPopups.map(popup => ({
      label: `${popup.name || popup.type} (${popup.id})`,
      value: `element:${popup.id}`,
      elementType: popup.type,
    })),
  },
];


  function GroupedInlineDropdown({ label, groups, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="px-2 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
        onClick={() => setOpen(o => !o)}
      >
        {label}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 bg-white border rounded shadow-md w-64 max-h-72 overflow-auto">
          {groups.map(group => (
            <div key={group.heading}>
              {/* HEADING */}
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                {group.heading}
              </div>

              {/* ITEMS */}
              {group.items.map(item => (
                <div
                  key={item.value}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getDataSourceStatus = () => {
  if (!dataSource?.mode) return "empty";

  // CURRENT USER
  if (dataSource.mode === "currentUser") {
    return "valid"; // always valid
  }

  // SEARCH
  if (dataSource.mode === "search") {
    if (!dataSource.type) return "incomplete";
    if (!dataSource.conditions?.length) return "incomplete";

    const incomplete = dataSource.conditions.some((c) => {
      if (!c.field) return true;
      if (!c.operator) return true;

      // right side missing
      if (!c.right?.source) return true;
      if (c.right.source === "current_user" && !c.right.field) return true;
      if (c.right.source === "static" && !c.right.value) return true;

      return false;
    });

    if (incomplete) return "incomplete";

    // CONTEXT CHECK (group vs repeating group)
    if (
  (selectedElement?.type !== "repeating_group" && selectedElement?.type !== "dropdown") &&
  !dataSource.modifier
) {
  return "incomplete";
}


    return "valid";
  }

  return "empty";
};
const dataSourceStatus = getDataSourceStatus();

  const [showPopup, setShowPopup] = useState(null);
  const [popupSelectedType, setPopupSelectedType] = useState(
    dataSource?.type || typeOfContent || ""
  );
  const [conditions, setConditions] = useState(
    dataSource?.conditions || []
  );
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const currentUserFields =
    datatypes.find((dt) => dt.name === "users")?.fields || [];

  useEffect(() => {
  setPopupSelectedType(dataSource?.type || typeOfContent || "");
  setConditions(dataSource?.conditions || []);
  setShowPopup(null); // reset popup when element changes
}, [elementId, dataSource?.conditions, typeOfContent]);


  const stopPropagation = (e) => e.stopPropagation();
const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (showPopup !== elementId) return;

    const trigger = document.getElementById(`datasource-trigger-${elementId}`);
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
  }, [showPopup, elementId]);

  const addCondition = () => {
    const newCondition = { field: "", operator: "", value: "" };
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    updateElementProperty(elementId, "dataSource", {
      ...dataSource,
      mode: "search",
      type: popupSelectedType,
      conditions: updatedConditions,
    });
  };

  const updateCondition = (index, key, value) => {
  setConditions((prev) => {
    const updated = [...prev];
    updated[index][key] = value;
    updateElementProperty(elementId, "dataSource", {
      ...dataSource,
      mode: "search",
      type: popupSelectedType,
      conditions: updated,
    });
    return updated;
  });
};

function DropdownButton({ label, options, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="px-2 py-1 bg-gray-200 rounded text-sm"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 w-36">
          {options.map((opt) => (
            <div
              key={opt.value}
              className="px-3 py-2 hover:bg-gray-100 text-sm cursor-pointer"
              onClick={() => {
                onSelect(opt.value);
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

  const fields =
    datatypes.find((dt) => dt.name === popupSelectedType)?.fields || [];
useEffect(() => {
  if (showPopup !== elementId) return;

  const panel = document.getElementById("properties-panel");
  if (!panel) return;

  const updatePopupPosition = () => {
    const rect = panel.getBoundingClientRect();

    setPopupPosition({
      top: rect.top + window.scrollY + 10, // align with panel top
      left: rect.left + window.scrollX - 500, // popup width + gap
    });
  };

  updatePopupPosition();
  window.addEventListener("scroll", updatePopupPosition);
  window.addEventListener("resize", updatePopupPosition);

  return () => {
    window.removeEventListener("scroll", updatePopupPosition);
    window.removeEventListener("resize", updatePopupPosition);
  };
}, [showPopup, elementId]);

  return (
    <div className="space-y-3">
      {/* Type of Content */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Type of Content
        </label>
        <select
          onMouseDown={stopPropagation}
          value={typeOfContent || ""}
          onChange={(e) =>
            updateElementProperty(elementId, "typeOfContent", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Select content type</option>
          {datatypes?.map((dt) => (
            <option key={dt.name} value={dt.name}>
              {dt.name}
            </option>
          ))}
        </select>
      </div>

     {/* Data Source Label */}
<label className="block text-xs font-medium text-gray-700 mb-1">
  Data Source
</label>

<div className="flex items-center gap-2 w-full">

  <div
  id={`datasource-trigger-${elementId}`}
  className={`
    flex items-center flex-wrap gap-2 px-2 py-2 rounded-md flex-1

    ${expressionResult.status === "empty" && "border border-gray-300 bg-white"}
    ${expressionResult.status === "invalid" && "border border-red-500 bg-red-50"}
    ${
      expressionResult.status === "valid" &&
      (
        (expressionResult.isList && (selectedElement?.type === "repeating_group" || selectedElement?.type === "dropdown")) ||
        (!expressionResult.isList && (selectedElement?.type !== "repeating_group" && selectedElement?.type !== "dropdown"))
      ) &&
      "border border-blue-500 bg-blue-50"
    }
  `}
>


    {/* TAG: Do a search for */}
    {dataSource?.mode === "search" && (
  <span className="flex items-center bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
    do a search for
    <button
      className="ml-1 text-red-200 hover:text-red-400 font-bold"
      onClick={() =>
        updateElementProperty(elementId, "dataSource", {
          mode: "",
          type: "",
          conditions: [],
          modifier: "",
        })
      }
    >
      ✕
    </button>
  </span>
)}

{dataSource?.mode === "search" && dataSource?.type && (
  <span className="flex items-center bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
    {dataSource.type}
    <button
      className="ml-1 text-red-200 hover:text-red-400 font-bold"
      onClick={() =>
        updateElementProperty(elementId, "dataSource", {
          ...dataSource,
          type: "",
          conditions: [],
        })
      }
    >
      ✕
    </button>
  </span>
)}


   
    {/* TAG: Current User */}
    {dataSource?.mode === "currentUser" && (
  <span className="flex items-center bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
    Current user
    {dataSource.conditions?.[0]?.field && (
      <>: {dataSource.conditions[0].field}</>
    )}
    <button
      className="ml-1 text-red-500 hover:text-red-700 font-bold"
      onClick={() =>
        updateElementProperty(elementId, "dataSource", {
          mode: "",
          type: "",
          conditions: [],
        })
      }
    >
      ✕
    </button>
  </span>
)}


    {/* TAG: Modifier */}
    {dataSource?.mode === "search" && dataSource?.modifier && (
  <span className="flex items-center bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
    {dataSource.modifier}
    <button
      className="ml-1 text-red-500 hover:text-red-700 font-bold"
      onClick={() =>
        updateElementProperty(elementId, "dataSource", {
          ...dataSource,
          modifier: "",
        })
      }
    >
      ✕
    </button>
  </span>
)}


    {/* SHOW + ONLY WHEN NOTHING IS SELECTED */}
{!dataSource?.mode && (
 <GroupedInlineDropdown
  label="+"
  groups={dataSourceGroups}
  onSelect={(item) => {

    if (item.value === "currentUser") {
      updateElementProperty(elementId, "dataSource", {
        mode: "currentUser",
        type: "users",
        conditions: [],
        modifier: "",
      });
      return;
    }

    if (item.value === "search") {
      setShowPopup(elementId);
      return;
    }

    if (item.value === "parent") {
      updateElementProperty(elementId, "dataSource", {
        mode: "parent",
      });
      return;
    }

    if (item.value.startsWith("element:")) {
      updateElementProperty(elementId, "dataSource", {
        mode: "element",
        elementId: item.value.split(":")[1],
      });
    }
  }}
/>

)}

  </div>

  {/* FILTER BUTTON */}
  {dataSource?.mode === "search" && (
    <button
      type="button"
      className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 whitespace-nowrap"
      onClick={(e) => {
        e.stopPropagation();
        setShowPopup((prev) => (prev === elementId ? null : elementId));
      }}
    >
      Filter
    </button>
  )}
{/* MODIFIER SELECTOR - only show if type is selected AND no modifier yet */}
{/* MODIFIER – DROPDOWN FIELD PICKER */}
{dataSource?.mode === "search" &&
 dataSource?.type &&
 isDropdown && (
  <DropdownButton
    label="Select field"
    options={dropdownFieldModifiers}
    onSelect={(modifier) =>
      updateElementProperty(elementId, "dataSource", {
        ...dataSource,
        modifier,
      })
    }
  />
)}
{/* MODIFIER – NORMAL ELEMENTS */}
{dataSource?.mode === "search" &&
 dataSource?.type &&
 !dataSource?.modifier &&
 !isDropdown &&
 selectedElement?.type !== "repeating_group" && (
  <SearchModifierSelector
    value={dataSource.modifier}
    onChange={(modifier) =>
      updateElementProperty(elementId, "dataSource", {
        ...dataSource,
        modifier,
      })
    }
  />
)}

</div>

{/* Popup */}
{showPopup === elementId && (
 <DoSearchExpressionPopup
  isOpen={true}
  datatypes={datatypes}
  pageElements={allElementsForPopup}
  initialValue={dataSource?.mode === "search" ? dataSource : null}
  anchorRect={document
    .getElementById(`datasource-trigger-${elementId}`)
    ?.getBoundingClientRect()}
  onClose={() => setShowPopup(null)}
  onConfirm={(newDataSource) => {
    updateElementProperty(elementId, "dataSource", newDataSource);
updateElementProperty(elementId, "typeOfContent", newDataSource.type);
    setShowPopup(null);
  }}
  onChangeType={(newType) => {
    // update the dataSource type live
    updateElementProperty(elementId, "dataSource", {
      ...dataSource,
      mode: "search",
      type: newType,
    });
    updateElementProperty(elementId, "typeOfContent", newType);
  }}
/>

)}

  </div>
  );
}
