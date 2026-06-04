import React, { useState, useRef, useEffect } from "react";
import { ELEMENT_PROPERTIES } from "./elementProperties"; // adjust path if needed
import WorkflowDoSearchPopup from "./WorkflowDoSearchPopup";

export default function InlineElementWithAdd({
  value,
  options,
  onChange,
  expectedType,
  datatypes = [],
}) {
  const [showElements, setShowElements] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [showOperators, setShowOperators] = useState(false);
const [showSearchPopup, setShowSearchPopup] = useState(false);

const [typeError, setTypeError] = useState(null);
const SEARCH_MODIFIERS = [
  { key: "first", label: "First item" },
  { key: "last", label: "Last item" },
  { key: "random", label: "Random item" },
];

const hasValue = !!value?.source;

  const wrapperRef = useRef(null);
useEffect(() => {
  function handleClickOutside(event) {
    if (
      wrapperRef.current &&
      !wrapperRef.current.contains(event.target)
    ) {
      setShowElements(false);
      setShowProperties(false);
      setShowOperators(false);
      // ❌ Don't touch showSearchPopup here
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

const isTypeValid =
  !expectedType
    ? true
    : value?.returnType
      ? expectedType === value.returnType
      : false;
const isSearch = value?.source === "do_search";

const selectedElement = isSearch
  ? {
      id: "do_search",
      displayName: "Do a Search",
      type: "search",
      elementType: "search", // ✅ VERY IMPORTANT
    }
  : options.find((el) => el.id === value?.source);

  const properties = selectedElement
    ? ELEMENT_PROPERTIES[selectedElement.elementType] || []
    : [];

const canAddProperty =
  selectedElement &&
  (
    (!isSearch && !value?.property) ||
    (isSearch && !value?.modifier) ||
    (isSearch && value?.modifier && !value?.property)
  );

const canAddOperator =
  selectedElement &&
  !isSearch &&
  value?.property &&
  value?.returnType === "text";
const showAdd = selectedElement !== null; // ✅ show Add for everything selected

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* MAIN BOX */}
<div
  className={`flex flex-wrap gap-1 items-center border rounded px-2 py-1 bg-white cursor-pointer min-h-[36px]
    ${
      hasValue
        ? isTypeValid
          ? "border-blue-400 ring-1 ring-blue-200"
          : "border-red-400 ring-1 ring-red-200"
        : "border-gray-300"
    }`}

  onClick={() => {
    if (isSearch) return;
    if (!selectedElement) setShowElements(true);
  }}
>
  {/* 🔍 SEARCH MODE */}
  {/* 🔍 DO A SEARCH → SOURCE */}
{isSearch && (
  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
    Do a search
    <button
      className="text-xs font-bold"
      onClick={(e) => {
        e.stopPropagation();
        onChange(null);
      }}
    >
      ×
    </button>
  </span>
)}

{/* 🔍 DO A SEARCH → MODIFIER */}
{isSearch && value?.modifier && (
  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
    {SEARCH_MODIFIERS.find(m => m.key === value.modifier)?.label}
    <button
      className="text-xs font-bold"
      onClick={(e) => {
        e.stopPropagation();
        onChange({
          ...value,
          modifier: null,
          property: null,
          returnType: null,
        });
      }}
    >
      ×
    </button>
  </span>
)}


{/* 🔍 DO A SEARCH → FIELD */}
{isSearch && value?.property && (
  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
    {value.property}
    <button
      className="text-xs font-bold"
      onClick={(e) => {
        e.stopPropagation();
        onChange({
          ...value,
          property: null,
          returnType: null,
        });
      }}
    >
      ×
    </button>
  </span>
)}




  {/* NORMAL MODE */}
  {!isSearch && !selectedElement && (
    <span className="text-gray-400">Select element</span>
  )}

  {!isSearch && selectedElement && !value.property && (
    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1
      ${isTypeValid ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
      {selectedElement.displayName}
      <button
        className="text-xs font-bold"
        onClick={(e) => {
          e.stopPropagation();
          onChange({ source: null, property: null, operators: [], returnType: null });
        }}
      >
        ×
      </button>
    </span>
  )}

       {/* NORMAL ELEMENT PROPERTY (NOT FOR SEARCH) */}
{!isSearch && selectedElement && value.property && (
  <>
    <span
      className={`px-2 py-0.5 rounded-full flex items-center gap-1
        ${
          isTypeValid
            ? "bg-blue-100 text-blue-800"
            : "bg-red-100 text-red-800"
        }`}
    >
      {selectedElement.displayName}'s {value.property}
      <button
        className="text-xs font-bold"
        onClick={(e) => {
          e.stopPropagation();
          onChange({
            source: selectedElement.id,
            property: null,
            operators: [],
            returnType: null,
          });
        }}
      >
        ×
      </button>
    </span>

    {value.operators?.map((op, idx) => (
      <span
        key={idx}
        className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1"
      >
        {op}
        <button
          className="text-xs font-bold"
          onClick={(e) => {
            e.stopPropagation();
            const newOps = [...(value.operators || [])];
            newOps.splice(idx, 1);
            onChange({ ...value, operators: newOps });
          }}
        >
          ×
        </button>
      </span>
    ))}
  </>
)}


        {/* ADD BUTTON */}
        {showAdd && (
          <button
            className="text-xs bg-gray-200 px-1 rounded ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (canAddProperty) setShowProperties(true);
              if (canAddOperator) setShowOperators(true);
            }}
          >
            Add
          </button>
        )}
      </div>
{/* EDIT SEARCH (OUTSIDE BOX) */}
  {isSearch && (
    <span
      className="bg-purple-50 text-purple-700 text-[11px] px-2 py-0.5 rounded-full cursor-pointer hover:bg-purple-100 whitespace-nowrap"
      onClick={(e) => {
        e.stopPropagation();
        setShowSearchPopup(prev => !prev);
      }}
    >
      Edit
    </span>
  )}




      {/* ⚠️ TYPE HINT */}
      {selectedElement && !value?.property && expectedType && (
        <div className="text-xs text-red-500 mt-1">
          Select a property to match type "{expectedType}"
        </div>
      )}

     {/* ELEMENT DROPDOWN */}
{showElements && !selectedElement && (
  <div className="absolute mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {/* ELEMENTS HEADER */}
    <div className="px-3 py-1 text-[10px] font-semibold uppercase text-blue-500 sticky top-0 bg-white border-b border-gray-200">
      Elements
    </div>

    {options
      .filter(o => o.type === "element")
      .map(el => (
        <div
          key={el.id}
          className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer transition-colors duration-150"
          onClick={() => {
            onChange({
              source: el.id,
              property: null,
              operators: [],
              returnType: null,
            });
            setShowElements(false);
          }}
        >
          {el.displayName} ({el.elementType})
        </div>
      ))}

    {/* DATA SOURCES HEADER */}
    <div className="px-3 py-1 mt-2 text-[10px] font-semibold uppercase text-purple-500 sticky top-0 bg-white border-b border-gray-200">
      Data Source
    </div>

    {options
      .filter(o => o.type !== "element")
      .map(el => (
        <div
          key={el.id}
          className="px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer transition-colors duration-150"
          onClick={() => {
            if (el.type === "search") {
              if (value?.source !== "do_search") {
                onChange({
                  source: "do_search",
                  property: null,
                  operators: [],
                  returnType: expectedType ?? null,
                  mode: "search",
                  isPlaceholder: true,
                });
              }
              setShowSearchPopup(true);
              setShowElements(false);
              return;
            }

            const actualType = el.returnType ?? null;
            if (expectedType && actualType && expectedType !== actualType) {
              setTypeError(`Type mismatch: expected ${expectedType}, got ${actualType}`);
              return;
            }
            setTypeError(null);

            onChange({
              source: el.id,
              property: null,
              operators: [],
              returnType: actualType,
            });
            setShowElements(false);
          }}
        >
          {el.displayName}
        </div>
      ))}
  </div>
)}

{/* PROPERTY DROPDOWN */}
{showProperties && selectedElement && (
  <div className="absolute mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {isSearch && !value?.modifier &&
      SEARCH_MODIFIERS.map(m => (
        <div
          key={m.key}
          className="px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer transition-colors duration-150"
          onClick={() => {
            onChange({ ...value, modifier: m.key });
            setShowProperties(false);
          }}
        >
          {m.label}
        </div>
      ))}

    {!isSearch && properties.map(prop => {
      const isCompatible = !expectedType || prop.type === expectedType;
      return (
        <div
          key={prop.key}
          className={`px-3 py-2 text-sm ${
            isCompatible
              ? "hover:bg-blue-50 cursor-pointer"
              : "text-gray-400 cursor-not-allowed"
          } transition-colors duration-150`}
          onClick={() => {
            if (!isCompatible) return;
            onChange({
              source: selectedElement.id,
              property: prop.key,
              operators: [],
              returnType: prop.type,
            });
            setShowProperties(false);
          }}
        >
          {selectedElement.displayName}'s {prop.label}
        </div>
      );
    })}
  </div>
)}

{/* OPERATOR DROPDOWN */}
{showOperators && (
  <div className="absolute mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 w-full max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {["lowercase", "uppercase", "trim"].map(op => (
      <div
        key={op}
        className="px-3 py-2 text-sm hover:bg-yellow-50 cursor-pointer transition-colors duration-150"
        onClick={() => {
          onChange({ ...value, operators: [...(value.operators || []), op] });
          setShowOperators(false);
        }}
      >
        {op}
      </div>
    ))}
  </div>
)}

 <WorkflowDoSearchPopup
  isOpen={showSearchPopup}
  expectedType={expectedType}
  datatypes={datatypes}
  initialValue={value?.source === "do_search" ? value : null} // ✅ ADD THIS
  onClose={() => setShowSearchPopup(false)}
  onConfirm={(searchConfig) => {
    onChange({
      source: "do_search",
      ...searchConfig,
      mode: "search",
      returnType: expectedType ?? null,
    });
    setShowSearchPopup(false);
  }}
/>
    </div>
    
  );
}
