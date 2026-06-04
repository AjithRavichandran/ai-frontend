// src/CanvasEditorRenderer.js
import React, { useState } from "react"; 
import Cat17 from "../../Cat 17.jpg"; // adjust path according to your folder structure
import { BACKEND_URL } from "../../config";
import { Pie, Bar, Line, Radar, PolarArea } from "react-chartjs-2"; // charts
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  BarController,
  LineController,
  PieController,
  RadarController,
  PolarAreaController,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  BarController,
  LineController,
  PieController,
  RadarController,
  PolarAreaController
);


export default function CanvasRendererEditor({
  element,
  handlers,
  onSelectElement,
  selectedElement,
  dropIndicator,
  highlightedContainerId,
  skipWrapper = false,   // 👈 NEW
})
 {
  const [hovered, setHovered] = useState(false);
  if (!element) return null;

// 🔒 Universal visibility guard
if (element.renderMode === "overlay") {
  if (!element.isOpen) return null;
} else {
  if (element.hidden) return null;
}


  const style = element.style || {};

const renderChart = (ChartComponent, data, chartTitle) => {
  const isCartesian = ["barchart", "linechart", "areachart"].includes(element.type);
  const isRadial = ["radarchart", "polarareachart"].includes(element.type);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 16,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 12,
          font: { family: "'Poppins', sans-serif", weight: 600, size: 13 },
          color: "#334155",
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1e293b",
        titleFont: { family: "'Poppins', sans-serif", weight: 700, size: 14 },
        bodyFont: { family: "'Poppins', sans-serif", weight: 500, size: 13 },
        padding: 12,
        cornerRadius: 12,
      },
    },

    // 🔑 CONDITIONAL SCALES
    scales: isCartesian
      ? {
          x: {
            ticks: {
              color: "#475569",
              font: { family: "'Poppins', sans-serif", size: 13 },
            },
            grid: {
              drawTicks: false,
              color: "rgba(148,163,184,0.1)",
              borderDash: [3, 3],
              drawBorder: false,
            },
          },
          y: {
            ticks: {
              color: "#475569",
              font: { family: "'Poppins', sans-serif", size: 13 },
            },
            grid: {
              drawTicks: false,
              color: "rgba(148,163,184,0.1)",
              borderDash: [3, 3],
              drawBorder: false,
            },
          },
        }
      : isRadial
      ? {
          r: {
            grid: {
              color: "rgba(148,163,184,0.12)", // subtle radial rings
            },
            angleLines: {
              color: "rgba(148,163,184,0.12)",
            },
            ticks: {
              display: false,
            },
          },
        }
      : {},

    elements: {
      line: {
        borderWidth: 3,
        tension: 0.4,
        borderCapStyle: "round",
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#475569",
        hoverBorderWidth: 3,
        hoverBorderColor: "#0ea5e9",
      },
      bar: {
        borderRadius: 12,
        barThickness: 36,
        maxBarThickness: 42,
      },
    },
  };

  return withDragWrapper(
    <div
      style={{
        width: "100%",

        height: element.style?.height || 400,
        borderRadius: 24,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: element.style?.backgroundColor || "#ffffff",
        boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      {chartTitle && (
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 20,
            textAlign: "center",
            color: "#1e293b",
          }}
        >
          {chartTitle}
        </h3>
      )}
      <ChartComponent data={data} options={chartOptions} />
    </div>
  );
};



const applyMargins = (s) => ({
  marginTop: s.marginTop ? `${s.marginTop}px` : undefined,
  marginRight: s.marginRight ? `${s.marginRight}px` : undefined,
  marginBottom: s.marginBottom ? `${s.marginBottom}px` : undefined,
  marginLeft: s.marginLeft ? `${s.marginLeft}px` : undefined,
});

const applyPadding = (s) => ({
  paddingTop: s.paddingTop ? `${s.paddingTop}px` : undefined,
  paddingRight: s.paddingRight ? `${s.paddingRight}px` : undefined,
  paddingBottom: s.paddingBottom ? `${s.paddingBottom}px` : undefined,
  paddingLeft: s.paddingLeft ? `${s.paddingLeft}px` : undefined,
});



  const finalStyle = {
  display: style.display ?? "flex",
  flexDirection: style.flexDirection,
  gap: style.gap ?? 0,
  padding: style.padding ?? 0,
  justifyContent: style.justifyContent,
  alignItems: style.alignItems,
  width: style.width,
  height: style.height,
  flexGrow: style.flexGrow,
  flexShrink: style.flexShrink,
  flexWrap: style.flexWrap,
  backgroundColor: style.backgroundColor,
  border: style.border,
  borderRadius: style.borderRadius,
};

const withDragWrapper = (node, elOverride) => {
  const localElement = elOverride || element; // use override when provided
  const isSelected = selectedElement?.id === localElement.id;

  const childStyle = node.props?.style || {};

  const isText = localElement.type === "text";

const isParentRow = localElement.parentFlexDirection === "row";

const wrapperWidth =
  localElement.style?.width ||
  (isParentRow ? "auto" : "auto"); // 👈 IMPORTANT
  const isHighlighted = highlightedContainerId === localElement.id;
const shouldSkipWrapper = (type) => type === "popup";

  return (
    <div
      draggable
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement?.(localElement, e);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData("text/plain", String(localElement.indexInParent ?? 0));
        e.dataTransfer.effectAllowed = "move";
        handlers?.onDragStart?.(
          e,
          localElement.parentId,
          localElement.indexInParent,
          localElement.id
        );
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, localElement.parentId, localElement.indexInParent);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, localElement.parentId, localElement.indexInParent);
      }}
      style={{
        position: "relative",
        display: "block",
        flexDirection: "column",
        width: wrapperWidth,
        height: "auto",

        alignSelf: childStyle.alignSelf || localElement.style?.alignSelf || "stretch",
        flexGrow: childStyle.flexGrow ?? localElement.style?.flexGrow ?? 0,
        flexShrink: childStyle.flexShrink ?? localElement.style?.flexShrink ?? 1,
        flexBasis: childStyle.flexBasis ?? localElement.style?.flexBasis ?? "auto",

        ...(localElement.style ? applyMargins(localElement.style) : {}),

       outline: isHighlighted ? "2px solid red" : "none",

        transition: "background-color 0.2s ease",
      }}
    >
      {dropIndicator &&
        dropIndicator.parentId === localElement.parentId &&
        dropIndicator.index === localElement.indexInParent && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: 2,
              backgroundColor: "#0ea5e9",
            }}
          />
        )}

      {React.cloneElement(node, {
        style: {
          ...childStyle,
          outline: isSelected ? "2px solid #0ea5e9" : hovered ? "1px solid #0ea5e9" : "none",
          outlineOffset: 2,
          transition: "outline 0.15s ease",
        },
      })}
    </div>
  );
};


  // Now render element types. Each rendered content will be wrapped by withDragWrapper
  switch (element.type) 
 {
  
  case "row-container": {
  const content = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "row",
        flexWrap: "nowrap",
        width: style.width || "100%",
        justifyContent: style.justifyContent || "flex-start",
        alignItems: style.alignItems || "stretch",
        ...applyPadding(style),
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0); // container-level
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0); // container-level
      }}
    >
   {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id, 
            parentFlexDirection: style.flexDirection,       // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}

  case "text": {
  const isParentRow = element.parentFlexDirection === "row";

  const content = (
    <div
      style={{
        ...finalStyle,

        // 🔥 layout width control
        width: isParentRow ? "auto" : (style.width || "100%"),

        // 🔥 text alignment ONLY affects content
        textAlign: style.textAlign || "left",
      }}
    >
      <span
        style={{
          display: "inline-block",

          fontSize: style.fontSize || 16,
          fontWeight: style.fontWeight || 400,
          fontStyle: style.fontStyle || "normal",
          textDecoration: style.textDecoration || "none",
          fontFamily: style.fontFamily || "inherit",
          color: style.color || "#000",

          backgroundColor: style.backgroundColor || "transparent",
          lineHeight: style.lineHeight || "normal",
          letterSpacing: style.letterSpacing || "normal",

          // ❌ REMOVE width from span
          // ❌ REMOVE alignSelf from span

          ...applyPadding(style),
        }}
      >
        {element.value}
      </span>
    </div>
  );

  return withDragWrapper(content);
}


case "piechart":
  return renderChart(Pie, element.data);
case "barchart":
  return renderChart(Bar, element.data);
case "linechart":
  return renderChart(Line, element.data);
case "radarchart":
  return renderChart(Radar, element.data);
case "areachart":
  return renderChart(Line, element.data); // make sure dataset.fill = true


  case "image": {
  const resolveImageSrc = () => {
  // if user uploaded a new file
  if (element.imageFile) return URL.createObjectURL(element.imageFile);

  const raw = element.src;

  if (!raw || raw.trim() === "") return Cat17;
  if (raw.startsWith("http")) return raw;

  return `${BACKEND_URL}/media/${raw.replace(/^\/+/, "")}`;
};

  const content = (
    <img
      src={resolveImageSrc()}
      alt={element.alt || ""}
      draggable={false}
      style={{
        width: style.width || "100%",
        height: style.height || "auto",
        objectFit: style.objectFit || "contain",
        alignSelf: style.alignSelf || "stretch",
        objectPosition: "center",
        ...applyPadding(style),
        borderRadius: style.borderRadius || 8,
      }}
    />
  );

  return withDragWrapper(content);
}

 case "column-container": {
  const content = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "column",
        flexWrap: style.flexWrap || "nowrap",
        width: style.width || "auto",
        justifyContent: style.justifyContent || "center",
        alignItems: style.alignItems || "stretch",
        ...applyPadding(style),
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0); // parent container
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
    {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id,
            parentFlexDirection: style.flexDirection,        // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}


case "popup": {
const isPopupVisible = element.isOpen === true && element.hidden !== true;


  const content = (
    <>
      {/* Overlay to block background interactions */}
      {isPopupVisible && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.3)",
      zIndex: 999,
    }}
    onClick={() => {
  handlers?.onToggleVisibility?.(element.id);
}}

  />
)}

<div
  style={{
    display: isPopupVisible ? "flex" : "none",
    flexDirection: element.style?.flexDirection || "column",
    gap: element.style?.gap || 8,
    paddingTop: element.style?.paddingTop,
    paddingBottom: element.style?.paddingBottom,
    paddingLeft: element.style?.paddingLeft,
    paddingRight: element.style?.paddingRight,
    justifyContent: "flex-start",
    alignItems: "stretch",
    width: element.style?.width || "auto",
    height: element.style?.height || "auto",
    minWidth: element.style?.minWidth || 280,
    minHeight: element.style?.minHeight || 120,
    maxWidth: element.style?.maxWidth || "90vw",
    maxHeight: element.style?.maxHeight || "80vh",
    backgroundColor: element.style?.backgroundColor || "#fff",
    border: element.style?.border || "1px solid #ccc",
    borderRadius: element.style?.borderRadius || 8,
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
    overflow: "auto",
  }}


        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlers?.onDragOver?.(e, element.id, 0);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlers?.onDrop?.(e, element.id, 0);
        }}
      >
        {(element.children || []).map((child, i) => {
          const childElement = {
            ...child,
            parentId: element.id,
            indexInParent: child.indexInParent ?? i,
            parentFlexDirection: element.style?.flexDirection,
          };

          return (
  <CanvasRendererEditor
    key={child.id + "_" + i}
    element={childElement}
    handlers={handlers}
    selectedElement={selectedElement}
    onSelectElement={onSelectElement}
    dropIndicator={dropIndicator}
    highlightedContainerId={highlightedContainerId}
    skipWrapper={true}   // ✅ THIS FIXES IT
  />
);
   })}
      </div>
    </>
  );

  return skipWrapper ? content : withDragWrapper(content, element);
}
case "datepicker": {
  const content = (
    <input
      type="date"
      disabled // 🔒 editor-only (no interaction)
      placeholder={element.placeholder || "Select date"}
      style={{
        width: element.style?.width || 200,
        paddingTop: element.style?.paddingTop || 6,
        paddingBottom: element.style?.paddingBottom || 6,
        paddingLeft: element.style?.paddingLeft || 8,
        paddingRight: element.style?.paddingRight || 8,
        border: element.style?.border || "1px solid #d1d5db",
        borderRadius: element.style?.borderRadius || 4,
        fontSize: element.style?.fontSize || 14,
        backgroundColor: "#f9fafb", // editor hint
        color: "#6b7280",
        cursor: "not-allowed",
      }}
    />
  );

  return skipWrapper ? content : withDragWrapper(content, element);
}

case "input": {
      const content = (
        <input
          type={element.inputType || "text"}
          placeholder={element.placeholder || "Input"}
          style={{
            ...applyPadding(style),
            borderRadius: style.borderRadius || 6,
            border: style.border || "1px solid #ccc",
            width: style.width || "200px",
            outline: "none",
            ...style,
          }}
          onChange={element.props?.onChange}
          onKeyDown={(e) =>
            element.props?.onSubmit && e.key === "Enter" && element.props.onSubmit(e)
          }
        />
      );
      return withDragWrapper(content);
    }
  

      
  case "dropdown": {
  const content = (
    <select
      value={element.value || ""}
      onChange={element.props?.onChange}

      // 👇 KEY LINE
      onMouseDown={(e) => {
        e.preventDefault();     // prevents dropdown from opening
        e.stopPropagation();    // keeps editor selection logic clean
      }}

      style={{
        borderRadius: style.borderRadius || 6,
        border: style.border || "1px solid #ccc",
        backgroundColor: style.backgroundColor || "#fff",
        color: style.color || "#000",
        width: style.width || "200px",
        cursor: "pointer",
        ...style,
        ...applyPadding(style),
      }}
    >
      {(element.options || []).map((opt, idx) => (
        <option key={idx} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );

  return withDragWrapper(content);
}



  case "navbar": {
  const groupedChildren = [];
  let buffer = [];

  // Group consecutive "link" elements into clusters
  (element.children || []).forEach((child) => {
    if (child.type === "link") {
      buffer.push(child);
    } else {
      if (buffer.length) {
        groupedChildren.push({ type: "cluster", items: buffer });
        buffer = [];
      }
      groupedChildren.push(child);
    }
  });
  if (buffer.length) groupedChildren.push({ type: "cluster", items: buffer });

  const content = (
    <div
      style={{
        display: "flex",
        justifyContent: style.justifyContent || "space-between",
        alignItems: style.alignItems || "center",
        backgroundColor: style.backgroundColor || "#fff",
        width: "100%",
        gap: style.gap || 16,
        ...applyPadding(style),
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
      {groupedChildren.map((group, groupIndex) => {
        // Normal element (not a cluster)
        if (group.type !== "cluster") {
          if (group.hidden) return null; // Skip hidden elements

          const childElement = {
            ...group,
            parentId: element.id,
            indexInParent: group.indexInParent ?? groupIndex,
            parentFlexDirection: style.flexDirection,
          };

          return withDragWrapper(
            <CanvasRendererEditor
              element={childElement}
              handlers={handlers}
              selectedElement={selectedElement}
              onSelectElement={onSelectElement}
              dropIndicator={dropIndicator}
              highlightedContainerId={highlightedContainerId}
            />,
            childElement
          );
        }

        // Cluster of links
        const visibleItems = group.items.filter((child) => !child.hidden);
        if (!visibleItems.length) return null; // Skip entire cluster if no visible children

        return (
          <div
            key={"cluster_" + groupIndex}
            style={{
              display: "flex",
              gap: "17px",
              pointerEvents: "none",
            }}
          >
            {visibleItems.map((child, i) => {
              const childElement = {
                ...child,
                parentId: element.id,
                indexInParent: child.indexInParent ?? i,
                parentFlexDirection: style.flexDirection,
              };

              return (
                <div key={child.id + "_" + i} style={{ pointerEvents: "auto" }}>
                  {withDragWrapper(
                    <CanvasRendererEditor
                      element={childElement}
                      handlers={handlers}
                      selectedElement={selectedElement}
                      onSelectElement={onSelectElement}
                      dropIndicator={dropIndicator}
                      highlightedContainerId={highlightedContainerId}
                    />,
                    childElement
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return withDragWrapper(content, element);
}

    case "repeating_group": {
  const repeat = element.repeatCount ?? 5;
  const direction = element.style?.flexDirection || "row";
  const isRow = direction === "row";

  const containerStyle = {
    display: "flex",
    flexDirection: direction,
    flexWrap: element.style?.flexWrap || "nowrap",
    overflowX: isRow ? "auto" : "visible",
    overflowY: isRow ? "hidden" : "auto",
    gap: element.style?.gap ?? 10,
    paddingTop: element.style?.paddingTop ?? 0,
    paddingBottom: element.style?.paddingBottom ?? 0,
    paddingLeft: element.style?.paddingLeft ?? 0,
    paddingRight: element.style?.paddingRight ?? 0,
    justifyContent: element.style?.justifyContent || "flex-start",
    alignItems: element.style?.alignItems || "flex-start",
    width: style.width || "100%",
    height: style.height,
    backgroundColor: style.backgroundColor,
  };

  const content = (
    <div
      style={containerStyle}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
      {Array.from({ length: repeat }).map((_, repeatIdx) => {
        const repeatedContainerId = `${element.id}_repeat_${repeatIdx}`;

        return (
          <div
            key={repeatedContainerId}
            style={{
              flex: isRow ? `0 0 ${element.itemWidth || 250}px` : "none",
              minWidth: isRow ? 200 : "auto",
              maxWidth: isRow ? 400 : "none",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 10,
              backgroundColor: "#ffffff",
              borderRadius: 8,
            }}
          >
            {/* ✅ Wrap children correctly */}
            {(element.children || []).map((child, childIndex) => {
              const childElement = (
                <CanvasRendererEditor
                  key={child.id + "_" + repeatIdx}
                  element={{
                    ...child,
                    parentId: element.id,
                    parentFlexDirection: style.flexDirection,
                    indexInParent: childIndex,
                  }}
                  handlers={handlers}
                  selectedElement={selectedElement}
                  onSelectElement={onSelectElement}
                  dropIndicator={dropIndicator}
                  highlightedContainerId={highlightedContainerId}
                />
              );

              return withDragWrapper(childElement);
            })}
          </div>
        );
      })}
    </div>
  );

  return withDragWrapper(content);
}



case "radio": {
  const content = (
    <div
      style={{
        display: "flex",
        justifyContent: style.justifyContent || "flex-start", // default
        alignItems: style.alignItems || "center",
        width: "100%",
        gap: 6,
        ...style,
        ...applyPadding(style), // apply padding last
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <input
          type="radio"
          name={element.name}
          checked={element.checked}
          onChange={() => {}}
          style={{ margin: 0 }}
        />
        <span>{element.value}</span>
      </label>
    </div>
  );

  return withDragWrapper(content);
}

case "dropdown": {
  const content = (
    <select
      value={element.value || ""}
      onChange={element.props?.onChange}
      style={{
        borderRadius: style.borderRadius || 6,
        border: style.border || "1px solid #ccc",
        backgroundColor: style.backgroundColor || "#fff",
        color: style.color || "#000",
        width: style.width || "200px",
        ...style,
        ...applyPadding(style), // apply padding last
      }}
    >
      {(element.options || []).map((opt, idx) => (
        <option key={idx} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
  return withDragWrapper(content);
}


case "label": {
  const content = (
    <span
      style={{
        fontSize: style.fontSize || 14,
        fontWeight: style.fontWeight || 400,
        color: style.color || "#000",
        ...style,
        ...applyPadding(style), // apply padding last
      }}
    >
      {element.value || "Label"}
    </span>
  );
  return withDragWrapper(content);
}

case "filter": {
  const content = (
    <button
      onClick={element.props?.onClick}
      style={{
        borderRadius: style.borderRadius || 6,
        backgroundColor: style.backgroundColor || "#f0f0f0",
        color: style.color || "#000",
        border: style.border || "1px solid #ccc",
        cursor: "pointer",
        fontSize: style.fontSize || 14,
        fontWeight: style.fontWeight || 400,
        ...style,
        ...applyPadding(style), // apply padding last
      }}
    >
      {element.value || "Filter"}
    </button>
  );
  return withDragWrapper(content);
}

case "checkbox": {
  const content = (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        ...style,
        ...applyPadding(style), // apply padding last
      }}
    >
      <input
        type="checkbox"
        checked={element.checked || false}
        onChange={element.props?.onChange}
      />
      {element.value || "Checkbox"}
    </label>
  );
  return withDragWrapper(content);
}

    case "link": {
  const content = (
    <a
      style={{
        display: "inline-block",         // needed for padding
        color: style.color || "#007BFF",
        textDecoration: style.textDecoration || "none",
        fontWeight: style.fontWeight || 500,
        ...style,                         // user styles first
        ...applyPadding(style),           // padding applied last
        cursor: "pointer",
      }}
    >
      {element.value}
    </a>
  );
  return withDragWrapper(content);
}


    case "icon": {
  const content = (
    <span
      style={{
        fontSize: style.fontSize || 20,
        color: style.color || "#000",
        ...style,
        ...applyPadding(style),
      }}
    >
      {element.value || "🔍"}
    </span>
  );
  return withDragWrapper(content);
}

case "logo": {
  const content = (
    <img
      src={element.src || ""}
      alt={element.alt || "Logo"}
      style={{
        height: style.height || 40,
        width: style.width || "auto",
        objectFit: "contain",
        cursor: "pointer",
        ...style,
        ...applyPadding(style),
      }}
    />
  );
  return withDragWrapper(content);
}


    case "search": {
      const content = (
        <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
          <input
            type="text"
            placeholder={element.placeholder || "Search..."}
            style={{
              flexGrow: 1,
              ...applyPadding(style),
              borderRadius: 6,
              border: "1px solid #ccc",
              outline: "none",
              ...element.inputStyle,
            }}
            onChange={element.props?.onChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") element.props?.onSubmit?.(e);
            }}
          />
          {element.icon && (
            <span
              style={{ cursor: "pointer", color: "#666", fontSize: 20 }}
              onClick={element.props?.onClick}
            >
              🔍
            </span>
          )}
        </div>
      );
      return withDragWrapper(content);
    }

    

    
    


    case "button": {
  const content = (
    <button
      style={{
        ...style,                        // ⭐ keep ALL user-applied styles
        display: "block",                // needed for alignSelf to work
        ...applyPadding(style),
        borderRadius: style.borderRadius || 8,
        cursor: style.cursor || "pointer",
        backgroundColor: style.backgroundColor || "#007BFF",
        color: style.color || "#fff",
        border: style.border || "none",

        // ⭐ text styling
        fontSize: style.fontSize || 16,
        fontWeight: style.fontWeight || 500,
        fontFamily: style.fontFamily || "inherit",
        fontStyle: style.fontStyle || "normal",
        textDecoration: style.textDecoration || "none",

        // ⭐ layout
        textAlign: style.textAlign || "center",
        alignSelf: style.alignSelf || "auto",
        width: style.width || "auto",
        minWidth: style.minWidth || "fit-content",
        flexShrink: style.flexShrink ?? 0,
      }}
    >
      {element.value}
    </button>
  );

  return withDragWrapper(content);
}


case "card": {
  const content = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection,
        gap: style.gap || 10,
        ...applyPadding(style),
        borderRadius: style.borderRadius || 12,
        boxShadow: style.boxShadow || "0 8px 20px rgba(0,0,0,0.15)",
        border: style.border || "1px solid rgba(0,0,0,0.05)",
        backgroundColor: style.backgroundColor || "#ffa200",
        minWidth: style.minWidth ?? "unset",
        maxWidth: style.maxWidth ?? "unset",
        width: style.width || "auto",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0); // target is this card
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0); // target is this card
      }}
    >
  {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id, 
            parentFlexDirection: style.flexDirection,       // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}



case "header": {
  const content = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "row",
        alignItems: style.alignItems || "center",
        justifyContent: style.justifyContent || "space-between",
        width: style.width || "100%",
        backgroundColor: style.backgroundColor || "#fff",
        boxShadow: style.boxShadow || "0 2px 5px rgba(0,0,0,0.1)",
        gap: style.gap || 10,
        ...style,
        ...applyPadding(style), // apply padding last
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
   {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id,
            parentFlexDirection: style.flexDirection,        // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}

case "banner": {
  const content = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "column",
        alignItems: style.alignItems || "center",
        justifyContent: style.justifyContent || "center",
        width: style.width || "100%",
        height: style.height || "auto",
        backgroundColor: style.backgroundColor || "#f5f5f5",
        backgroundImage: element.src ? `url(${element.src})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: style.color || "#000",
        gap: style.gap || 10,
        ...style,
        ...applyPadding(style), // apply padding last
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
   {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id,   
            parentFlexDirection: style.flexDirection,     // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}

default: {
  const content = (
    <div
      style={finalStyle}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDragOver?.(e, element.id, 0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handlers?.onDrop?.(e, element.id, 0);
      }}
    >
  {(element.children || []).map((child, childIndex) => (
        <CanvasRendererEditor
          key={child.id + "_" + childIndex} 
          element={{
            ...child,
            parentId: element.id,
            parentFlexDirection: style.flexDirection,        // ✅ correct parent container
            indexInParent: childIndex,   // ✅ child index in this container
          }}
          handlers={handlers}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          dropIndicator={dropIndicator}
          highlightedContainerId={highlightedContainerId}
        />
      ))}
    </div>
  );
  return withDragWrapper(content);
}
  }
}

