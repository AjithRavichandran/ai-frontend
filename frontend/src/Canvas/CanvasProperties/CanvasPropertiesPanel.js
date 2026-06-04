// src/CanvasPropertiesPanel.js
import React, { useState, useEffect, useRef } from "react";
import { Monitor, Tablet, Smartphone, Upload } from "lucide-react";
import { normalizeStyleKeys } from "../CanvasnormalizeStyleKeys";
import DataSourceSelector from "./CanvasDatasource";
import CanvasPropertiesPanelLayout from "./CanvasPropertiesPanelLayout";
import DynamicExpressionBuilder from "./DynamicExpressionBuilder";
import CanvasConditionalPanel from "./CanvasConditionalPanel";
import { BACKEND_URL } from "../../config";
import { useAuthStore } from "../../authStore"; // adjust path if needed

export default function CanvasPropertiesPanel({
  activeScreen,
  setActiveScreen,
  selectedElement,
  updateElementProperty,
  updateElementStyle,
  handleImageUpload,
  datatypes,
  panelPosition,
  canvasTree, 
  
}) {
  const [activeTab, setActiveTab] = useState("appearance");
  const [prevElementId, setPrevElementId] = useState(null);
  const [localContent, setLocalContent] = useState("");
  const [localAltText, setLocalAltText] = useState("");
const [localImageSrc, setLocalImageSrc] = useState(selectedElement?.src || "");
const isImage =
  selectedElement?.type?.toLowerCase().trim() === "image";
const normalizeColors = (dataset) => {
  const dataLength = Array.isArray(dataset.data) ? dataset.data.length : 1;
  return {
    backgroundColor: Array.isArray(dataset.backgroundColor)
      ? dataset.backgroundColor
      : Array(dataLength).fill(dataset.backgroundColor || "#3b82f6"),
    borderColor: Array.isArray(dataset.borderColor)
      ? dataset.borderColor
      : Array(dataLength).fill(dataset.borderColor || "#1f2937"),
  };
};


  const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};
const isChart = selectedElement?.type?.toLowerCase().includes("chart");
const [localChartData, setLocalChartData] = useState(selectedElement?.data || {});

useEffect(() => {
  if (isChart) {
    setLocalChartData(selectedElement.data || {});
  }
}, [selectedElement, isChart]);

const isImageInsideRepeatingGroup = () => {
  if (!isImage || !canvasTree?.pages || !selectedElement) return false;

  let current = selectedElement;

  while (current?.parentId) {
    const parent = findNodeById(canvasTree.pages, current.parentId);
    if (!parent) break;

    if (parent.type?.toLowerCase() === "repeating_group") {
      return true;
    }

    current = parent;
  }

  return false;
};
const chartType = selectedElement?.type?.toLowerCase();
const isLineType =
  chartType === "linechart" ||
  chartType === "areachart" ||
  chartType === "radarchart";


const isTextLike =
  !isImage &&
  selectedElement?.value !== undefined;

  // Merge all style-related local states into one object
  const [localStyle, setLocalStyle] = useState({
  marginTop: "",
  marginRight: "",
  marginBottom: "",
  marginLeft: "",
  paddingTop: "",
  paddingRight: "",
  paddingBottom: "",
  paddingLeft: "",
  gap: "",
  textAlign: "left",
  justifyContent: "flex-start",
  alignItems: "stretch",
  alignSelf: "initial",
  minWidth: "",
  maxWidth: "",
  fontSize: 14,
  width: "",   // ✅ Add width
  height: "",
});
const isDropdown =
  selectedElement?.type?.toLowerCase().trim() === "dropdown";
const fileInputRef = useRef(null);



const [dropdownStaticValue, setDropdownStaticValue] = useState("");
useEffect(() => {
  if (isDropdown && selectedElement) {
    setDropdownStaticValue(
      Array.isArray(selectedElement.staticValue)
        ? selectedElement.staticValue.map(opt => opt.label).join("\n") // 👈 fix here
        : selectedElement.staticValue || ""
    );
  }
}, [selectedElement, isDropdown]);

useEffect(() => {
  setLocalImageSrc(selectedElement?.src || "");
}, [selectedElement]);

const handleFileChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    alert("You must log in first to upload an image");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${BACKEND_URL}/api/generate/upload-image/${selectedElement.id}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err.error || res.status));
      return;
    }

    const data = await res.json();

    // Update both the element and local state
// Backend already returns full MEDIA_URL path
updateElementProperty(selectedElement.id, "src", `${BACKEND_URL}${data.src}`);
setLocalImageSrc(`${BACKEND_URL}${data.src}`);


  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed due to network error");
  }

  e.target.value = "";
};

  const stopPropagation = (e) => e.stopPropagation();
  const elementId = selectedElement?.id;

  // Update localStyle whenever selectedElement changes
  useEffect(() => {
    if (!selectedElement) return;

    const normalizedStyle = normalizeStyleKeys(selectedElement.style);
    setLocalStyle((prev) => ({
      ...prev,
      flexDirection: normalizedStyle.flexDirection,
      textAlign: normalizedStyle.textAlign || "left",
      justifyContent: normalizedStyle.justifyContent || "flex-start",
      alignItems: normalizedStyle.alignItems || "stretch",
      alignSelf: normalizedStyle.alignSelf || "initial",
      marginTop: normalizedStyle.marginTop || "",
marginRight: normalizedStyle.marginRight || "",
marginBottom: normalizedStyle.marginBottom || "",
marginLeft: normalizedStyle.marginLeft || "",
gap: normalizedStyle.gap || "",
paddingTop: normalizedStyle.paddingTop || "",
paddingRight: normalizedStyle.paddingRight || "",
paddingBottom: normalizedStyle.paddingBottom || "",
paddingLeft: normalizedStyle.paddingLeft || "",

      minWidth: normalizedStyle.minWidth || "",
      maxWidth: normalizedStyle.maxWidth || "",
      fontSize: normalizedStyle.fontSize || 14,
      width: normalizedStyle.width || "",    // ✅
    height: normalizedStyle.height || "",  // 
    }));
  }, [selectedElement]);

  // Update content and altText when selectedElement changes
  useEffect(() => {
    if (selectedElement && selectedElement.id !== prevElementId) {
      setLocalContent(selectedElement.value || "");
      setLocalAltText(selectedElement.altText || "");
      setPrevElementId(selectedElement.id);
    }
  }, [selectedElement, prevElementId]);

  // Generic style change handler
  const handleStyleChange = (key, value) => {
    setLocalStyle((prev) => ({ ...prev, [key]: value }));
    updateElementStyle(elementId, key, value);
  };

  // Handlers for content and alt text
  const handleContentChange = (value) => {
    setLocalContent(value);
    updateElementProperty(elementId, "value", value);
  };
  const handleAltTextChange = (value) => {
    setLocalAltText(value);
    updateElementProperty(elementId, "altText", value);
  };
const choiceSource = selectedElement.choiceSource || "static";

const supportsDynamicData =
  !isDropdown &&
  choiceSource !== "dynamic" &&
  (
    ![
      "row-container",
      "column-container",
      "header",
      "navbar",
      "repeating_group",
      "banner",
    ].includes(selectedElement.type?.toLowerCase().trim())
  );

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4 text-center text-gray-500">
        <p className="text-sm">Select an element to edit its properties</p>
      </div>
    );
  }
const dataset = localChartData?.datasets?.[0] || {};

  return (
    <div id="properties-panel" 
    className="w-full min-w-0 bg-white border-l border-gray-200 overflow-y-auto overflow-x-hidden relative"

    >

      {/* HEADER */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button
            className={`text-sm font-medium px-2 py-1 rounded ${
              activeTab === "appearance"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("appearance")}
          >
            Appearance
          </button>
          <button
            className={`text-sm font-medium px-2 py-1 rounded ${
              activeTab === "layout"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("layout")}
          >
            Layout
          </button>
          <button
            className={`text-sm font-medium px-2 py-1 rounded ${
              activeTab === "conditional"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("conditional")}
          >
            Conditional
          </button>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm">Screen</span>
          <div className="flex space-x-1">
            {[
              { size: "LG", icon: Monitor },
              { size: "MD", icon: Tablet },
              { size: "SM", icon: Smartphone },
            ].map(({ size, icon: Icon }) => (
              <button
                key={size}
                onClick={() => setActiveScreen(size)}
                className={`p-2 text-xs rounded ${
                  activeScreen === size
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Element type */}
        <div className="text-xs text-gray-500">
  Element:{" "}
  <span className="font-medium text-gray-800">
    {selectedElement.type.toUpperCase()} ({selectedElement.id})
  </span>
</div>

      </div>


      {/* CONTENT */}
      <div className="p-4 space-y-4">
        {/* TEXT-based components */}
        {/* VALUE field for text-like elements */}
{isTextLike && (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      Value
    </label>
    <input
      type="text"
      onMouseDown={stopPropagation}
      value={localContent}
      onChange={(e) => handleContentChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      placeholder="Enter value"
    />
  </div>
)}


       {/* APPEARANCE */}
{activeTab === "appearance" && (
  <div className="space-y-4">

{isChart && (
  <div className="space-y-6">

    {/* ================= CHART DATA ================= */}
    <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
      <h3 className="text-base font-semibold text-gray-800 text-center tracking-wide">
  Chart Data
</h3>



      <div className="text-xs text-gray-500 space-y-1">
        <p>Separate items using commas.</p>
        <p>Labels and data counts must match.</p>
        <p>Example Labels: Jan, Feb, Mar</p>
        <p>Example Data: 10, 20, 30</p>
      </div>

      {/* Labels */}
      {localChartData.labels && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Labels
          </label>
          <input
            type="text"
            value={localChartData.labels.join(", ")}
            onChange={(e) => {
              const labels = e.target.value
                .split(",")
                .map((l) => l.trim());

              const updatedData = {
                ...localChartData,
                labels,
              };

              setLocalChartData(updatedData);
              updateElementProperty(
                selectedElement.id,
                "data",
                updatedData
              );
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      )}

      {/* Dataset Label */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Dataset Label
        </label>
        <input
          type="text"
          value={localChartData.datasets?.[0]?.label || ""}
          onChange={(e) => {
            const newDatasets = [
              { ...localChartData.datasets[0], label: e.target.value },
            ];

            const updatedData = {
              ...localChartData,
              datasets: newDatasets,
            };

            setLocalChartData(updatedData);
            updateElementProperty(
              selectedElement.id,
              "data",
              updatedData
            );
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* Data */}
      <div className="mt-5">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Data
        </label>
        <input
          type="text"
          value={
            Array.isArray(localChartData.datasets?.[0]?.data)
              ? localChartData.datasets[0].data.join(", ")
              : ""
          }
          onChange={(e) => {
            const data = e.target.value
              .split(",")
              .map((d) => (isNaN(d) ? d.trim() : +d));

            const dataset = {
              ...localChartData.datasets[0],
              data,
            };

            const normalized = normalizeColors(dataset);
            dataset.backgroundColor = normalized.backgroundColor;
            dataset.borderColor = normalized.borderColor;

            const updatedData = {
              ...localChartData,
              datasets: [dataset],
            };

            setLocalChartData(updatedData);
            updateElementProperty(
              selectedElement.id,
              "data",
              updatedData
            );
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* ================= COLORS ================= */}
{dataset && (
  <div className="border-t pt-3 space-y-4">

{isLineType ? (
  <div className="space-y-4">

    {/* 🔵 LINE / AREA STYLE */}

  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
    Line Style
  </h4>

  <div className="grid grid-cols-2 gap-4">

    {/* Line Color */}
    <div className="flex flex-col space-y-1">
      <label className="text-xs text-gray-500">Line</label>
      <input
        type="color"
        value={dataset.borderColor || "#34d399"}
        onChange={(e) => {
          const updatedDataset = {
            ...dataset,
            borderColor: e.target.value,
          };

          const updatedData = {
            ...localChartData,
            datasets: [updatedDataset],
          };

          setLocalChartData(updatedData);
          updateElementProperty(selectedElement.id, "data", updatedData);
        }}
        className="w-full h-9 rounded-md border cursor-pointer"
      />
    </div>

    {/* Fill Color */}
    <div className="flex flex-col space-y-1">
      <label className="text-xs text-gray-500">Fill</label>
      <input
        type="color"
        value={dataset.backgroundColor || "#34d399"}
        onChange={(e) => {
          const updatedDataset = {
            ...dataset,
            backgroundColor: e.target.value,
            fill: true, // important for Chart.js
          };

          const updatedData = {
            ...localChartData,
            datasets: [updatedDataset],
          };

          setLocalChartData(updatedData);
          updateElementProperty(selectedElement.id, "data", updatedData);
        }}
        className="w-full h-9 rounded-md border cursor-pointer"
      />
    </div>

  </div>

  {/* Line Width */}
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-gray-500">Line Width</label>
    <input
      type="range"
      min="1"
      max="10"
      value={dataset.borderWidth || 2}
      onChange={(e) => {
        const updatedDataset = {
          ...dataset,
          borderWidth: Number(e.target.value),
        };

        const updatedData = {
          ...localChartData,
          datasets: [updatedDataset],
        };

        setLocalChartData(updatedData);
        updateElementProperty(selectedElement.id, "data", updatedData);
      }}
      className="w-full"
    />
  </div>
</div>


    ) : (

      /* 🟡 BAR / PIE STYLE (Per Point Colors) */
      Array.isArray(dataset.data) &&
      dataset.data.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">
            Colors
          </h4>

          <div className="grid grid-cols-4 gap-4">
            {dataset.data.map((_, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2">
                <span className="text-[10px] text-gray-500">
                  {localChartData.labels?.[idx] || `Data ${idx + 1}`}
                </span>

                <input
                  type="color"
                  value={
                    Array.isArray(dataset.backgroundColor)
                      ? dataset.backgroundColor[idx]
                      : "#3b82f6"
                  }
                  onChange={(e) => {
                    const normalized = normalizeColors(dataset);

                    const updatedDataset = {
                      ...dataset,
                      backgroundColor: [...normalized.backgroundColor],
                      borderColor: [...normalized.borderColor],
                    };

                    updatedDataset.backgroundColor[idx] = e.target.value;

                    const updatedData = {
                      ...localChartData,
                      datasets: [updatedDataset],
                    };

                    setLocalChartData(updatedData);
                    updateElementProperty(
                      selectedElement.id,
                      "data",
                      updatedData
                    );
                  }}
                  className="w-8 h-8 rounded border"
                />
              </div>
            ))}
          </div>
        </div>
      )

    )}
  </div>
)}


      {/* Border Width */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Border Width
        </label>
        <input
          type="number"
          min={0}
          value={localChartData.datasets?.[0]?.borderWidth || 1}
          onChange={(e) => {
            const dataset = {
              ...localChartData.datasets[0],
              borderWidth: +e.target.value,
            };

            const updatedData = {
              ...localChartData,
              datasets: [dataset],
            };

            setLocalChartData(updatedData);
            updateElementProperty(
              selectedElement.id,
              "data",
              updatedData
            );
          }}
          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {/* ================= DIMENSIONS ================= */}

      <div className="border-t pt-2">
  <h3 className="text-base font-semibold text-gray-800">
    Dimensions
  </h3>
</div>


      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Width
        </label>
        <input
          type="text"
          value={localStyle.width || ""}
          placeholder="e.g. 300px or 100%"
          onChange={(e) =>
            handleStyleChange("width", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          onMouseDown={stopPropagation}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Height
        </label>
        <input
          type="text"
          value={localStyle.height || ""}
          placeholder="e.g. 300px"
          onChange={(e) =>
            handleStyleChange("height", e.target.value)
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          onMouseDown={stopPropagation}
        />
      </div>
    </div>

    </div>

    

)}


      {/* IMAGE */}
{isImage && (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        Image Upload
      </label>

      {/* Hidden file input (THIS IS REQUIRED) */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  style={{ display: "none" }}
  onChange={handleFileChange}
/>


      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center space-x-2"
      >
        <Upload className="w-4 h-4" />
        <span>
{selectedElement.src ? "Change Image" : "Upload Image"}
        </span>
      </button>
    </div>

   {localImageSrc && (
  <div className="border rounded-md p-2 bg-gray-50">
    <p className="text-xs text-gray-500 mt-1">
      Image uploaded successfully
    </p>
  </div>
)}

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Alt Text
      </label>
      <input
        type="text"
        onMouseDown={stopPropagation}
        value={localAltText}
        onChange={(e) => handleAltTextChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        placeholder="Describe the image"
      />
    </div>
    {/* IMAGE SIZE */}
{isImage && (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Width
      </label>
      <input
        type="text"
  value={String(localStyle.width).replace("px", "")} // fix here
        onMouseDown={stopPropagation}
        onChange={(e) => {
          const v = e.target.value;
          setLocalStyle(prev => ({ ...prev, width: v }));
          // Add px if it's a number
          handleStyleChange(
            "width",
            /^\d+$/.test(v) ? `${v}px` : v
          );
        }}
        placeholder="e.g. 200 or 100%"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>

    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Height
      </label>
      <input
        type="text"
  value={String(localStyle.height).replace("px", "")} // fix here
        onMouseDown={stopPropagation}
        onChange={(e) => {
          const v = e.target.value;
          setLocalStyle(prev => ({ ...prev, height: v }));
          handleStyleChange(
            "height",
            /^\d+$/.test(v) ? `${v}px` : v
          );
        }}
        placeholder="e.g. 150 or auto"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>
  </div>
)}

  </div>
)}
    {/* DROPDOWN STATIC OPTIONS */}
    {isDropdown && (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Static options
        </label>

        <p className="text-xs text-gray-500 mb-2">
          One option per line:
          <span className="text-gray-800 font-medium ml-1">a, b, c</span>
        </p>

        <textarea
          onMouseDown={stopPropagation}
          value={dropdownStaticValue}
          onChange={(e) => {
            const value = e.target.value;
            setDropdownStaticValue(value);

            const optionsArray = value
              .split("\n")
              .map(v => v.trim())
              .filter(Boolean)
              .map(v => ({ label: v, value: v }));

            updateElementProperty(elementId, "staticValue", optionsArray);
          }}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none whitespace-pre-wrap"
          placeholder="Enter one option per line"
        />
      </div>
    )}

    {/* DATA SOURCE SELECTOR */}
    {[
      "row-container",
      "column-container",
      "header",
      "navbar",
      "repeating_group",
      "banner",
      "dropdown",
    ].includes(selectedElement.type?.toLowerCase().trim()) && (
      <DataSourceSelector
        elementId={selectedElement.id}
        typeOfContent={selectedElement.typeOfContent}
        dataSource={selectedElement.dataSource}
        datatypes={datatypes}
        updateElementProperty={updateElementProperty}
        panelPosition={panelPosition}
        selectedElement={selectedElement}
        canvasTree={canvasTree}
      />
    )}

    {/* DYNAMIC DATA */}
    {supportsDynamicData && (
      <div className="mt-3 border-t pt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Dynamic Data
        </label>

        <DynamicExpressionBuilder
          selectedElement={selectedElement}
          datatypes={datatypes}
          updateElementProperty={updateElementProperty}
          canvasTree={canvasTree}
        />
      </div>
    )}

    {/* STYLE CONTROLS */}
    {!isImage && (
      <>
        {/* Background */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Background
          </label>
          <input
            type="color"
            onMouseDown={stopPropagation}
            value={selectedElement.style?.backgroundColor || "#ffffff"}
            onChange={(e) =>
              handleStyleChange("backgroundColor", e.target.value)
            }
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        {/* Text Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <input
            type="color"
            onMouseDown={stopPropagation}
            value={selectedElement.style?.color || "#000000"}
            onChange={(e) =>
              handleStyleChange("color", e.target.value)
            }
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            onMouseDown={stopPropagation}
            value={
              selectedElement.updatedStyle?.fontFamily ??
              selectedElement.style?.fontFamily ??
              "Arial"
            }
            onChange={(e) =>
              handleStyleChange("fontFamily", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {[
              "Arial",
              "Inter",
              "Poppins",
              "Roboto",
              "Verdana",
              "Tahoma",
              "Times New Roman",
              "Georgia",
              "Courier New",
            ].map(font => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <input
            type="number"
            onMouseDown={stopPropagation}
            value={localStyle.fontSize}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setLocalStyle(prev => ({
                ...prev,
                fontSize: isNaN(v) ? "" : v,
              }));
            }}
            onBlur={() =>
              handleStyleChange(
                "fontSize",
                isNaN(localStyle.fontSize) ? 14 : localStyle.fontSize
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Text Style */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Text Style
          </label>
          <div className="flex gap-2">
            <button
              onMouseDown={stopPropagation}
              onClick={() =>
                handleStyleChange(
                  "fontWeight",
                  selectedElement.style?.fontWeight === "bold"
                    ? "normal"
                    : "bold"
                )
              }
              className={`px-3 py-1 border rounded ${
                selectedElement.style?.fontWeight === "bold"
                  ? "bg-gray-300"
                  : ""
              }`}
            >
              B
            </button>

            <button
              onMouseDown={stopPropagation}
              onClick={() =>
                handleStyleChange(
                  "fontStyle",
                  selectedElement.style?.fontStyle === "italic"
                    ? "normal"
                    : "italic"
                )
              }
              className={`px-3 py-1 border rounded italic ${
                selectedElement.style?.fontStyle === "italic"
                  ? "bg-gray-300"
                  : ""
              }`}
            >
              I
            </button>

            <button
              onMouseDown={stopPropagation}
              onClick={() =>
                handleStyleChange(
                  "textDecoration",
                  selectedElement.style?.textDecoration === "underline"
                    ? "none"
                    : "underline"
                )
              }
              className={`px-3 py-1 border rounded ${
                selectedElement.style?.textDecoration === "underline"
                  ? "bg-gray-300"
                  : ""
              }`}
            >
              U
            </button>
          </div>
        </div>
      </>
    )}
  </div>
)}


        {/* LAYOUT */}
        {activeTab === "layout" && (
  <CanvasPropertiesPanelLayout
    selectedElement={selectedElement}
    localStyle={localStyle}
    setLocalStyle={setLocalStyle}
    handleStyleChange={handleStyleChange}
    stopPropagation={stopPropagation}
    updateElementStyle={updateElementStyle}
  />
)}

{/* CONDITIONAL */}
{activeTab === "conditional" && (
  <CanvasConditionalPanel
    selectedElement={selectedElement}
    canvasTree={canvasTree}
    updateElementProperty={updateElementProperty}
  />
)}



      </div>
    </div>
  );
}
