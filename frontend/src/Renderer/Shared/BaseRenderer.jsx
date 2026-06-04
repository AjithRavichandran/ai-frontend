// PreviewRenderer.js
import React, { useEffect } from "react";
import { runWorkflow } from './runWorkflow';
import Cat17 from "../../../Cat 17.jpg";

export default function BaseRenderer({
  element,
  parentData,
  store,        // 🔥 injected (PreviewStore OR LiveStore)
  navigate,
  projectSlug,
  pageName,
}){
    const {
  workflows,
  runtimeTree,
  appdata,
  dynamicValue,
  dbdata,
  setActivePage,
  setElementValue,
  sessionId,
  authError,
  openPopupId,
  closePopup,
  currentUser,
  activePageId,
} = store;

const isLoggedIn = Boolean(currentUser);

const pageLoadRanRef = React.useRef(false);

const isElementVisible = (el) => {
  if (!el) return false;
  if (el.hidden) return false; // respect hidden flag

  const cond = el.conditional;
  if (!cond) return true;

  if (cond.source === "current_user") {
    if (cond.operator === "logged_in") return isLoggedIn;
    if (cond.operator === "logged_out") return !isLoggedIn;
  }

  return true;
};

const triggerWorkflow = async (trigger) => {
  if (!Array.isArray(workflows) || workflows.length === 0) return;

  const matchedWorkflows = workflows.filter((wf) => {
    const elementMatch = String(wf.elementId) === String(element?.id);
    const generalMatch = wf.elementId == null;
    return (
      (elementMatch || generalMatch) &&
      wf.trigger?.type === trigger.type &&
      wf.trigger?.event === trigger.event
    );
  });

  for (const wf of matchedWorkflows) {
    await runWorkflow(
      element?.id || null,
      trigger,
      workflows,
      runtimeTree?.pages || [],
      setActivePage,
      appdata,
      navigate,
      projectSlug,
      store // 🔥 pass store
    );
  }
};


const [openDropdownId, setOpenDropdownId] = React.useState(null);

const toggleDropdown = (id) => {
  setOpenDropdownId((prev) => (prev === id ? null : id));
};


useEffect(() => {
  pageLoadRanRef.current = false;
}, [element?.id]);


useEffect(() => {
  if (!element) return;
  if (element.type !== "page") return;

  // ✅ prevent reruns caused by input typing / state updates
  if (pageLoadRanRef.current) return;

  pageLoadRanRef.current = true;

  triggerWorkflow({
    type: "general",
    scope: "page",
    event: "loaded",
  });
}, [element?.id]);

  const currentItem = parentData || {};

  const style = element.style || {};
  const finalStyle = {
    display: style.display,
    flexDirection: style.flexDirection,
    flexWrap: style.flexWrap,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    alignSelf: style.alignSelf,
    textAlign: style.textAlign,
    gap: style.gap ? `${style.gap}px` : undefined,
    marginTop: style.marginTop ? `${style.marginTop}px` : undefined,
    marginRight: style.marginRight ? `${style.marginRight}px` : undefined,
    marginBottom: style.marginBottom ? `${style.marginBottom}px` : undefined,
    marginLeft: style.marginLeft ? `${style.marginLeft}px` : undefined,
    paddingTop: style.paddingTop ? `${style.paddingTop}px` : undefined,
    paddingRight: style.paddingRight ? `${style.paddingRight}px` : undefined,
    paddingBottom: style.paddingBottom ? `${style.paddingBottom}px` : undefined,
    paddingLeft: style.paddingLeft ? `${style.paddingLeft}px` : undefined,
    width: style.width,
    height: style.height,
    flexGrow: style.flexGrow,
    flexShrink: style.flexShrink,
    backgroundColor: style.backgroundColor,
    border: style.border,
    borderRadius: style.borderRadius,
  };

if (!isElementVisible(element)) return null;
  // Helper: get dynamic value from parentData or currentItem
const getDynamicValue = (el, currentItem) => {
  const key = String(el.id);

  // workflow-set values
  if (store.dynamicValue && key in store.dynamicValue) {
    return store.dynamicValue[key];
  }

  // ⭐ current_user.*
  if (el.dynamicData?.startsWith("current_user.")) {
    const path = el.dynamicData.replace("current_user.", "").split(".");
    let value = store.currentUser;

    for (const part of path) {
      if (value && part in value) value = value[part];
      else return "";
    }
    return value ?? "";
  }

  // 1️⃣ Record-level dynamic_value
  if (currentItem?.dynamic_value && key in currentItem.dynamic_value) {
    const v = currentItem.dynamic_value[key];
    if (v !== null && v !== undefined) return v;
  }

  // 2️⃣ Parent / group data
  if (el.dynamicData) {
    const parts = el.dynamicData.split(".");
    let value = currentItem;

    if (parts[0] === "parent_group") parts.shift();

    for (const part of parts) {
      if (value && part in value) value = value[part];
      else return "";
    }

    return value;
  }

  // 3️⃣ Static fallback
  return el.value || "";
};

    let rendered = null;

    switch (element.type) {

      case "link":
  rendered = (
    <a
      href={element.href || "#"}
      onClick={async (e) => {
    e.preventDefault(); // prevent default navigation
    await triggerWorkflow({ type: "element", scope: "element", event: "clicked" });

  }}

      style={{
        ...finalStyle,                  // ✅ USE SAME LOGIC AS TEXT
        display: "inline-block",        // ensure margin applies
        color: style.color || "#007BFF",
        fontWeight: style.fontWeight || 500,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      {getDynamicValue(element, currentItem)}
    </a>
  );
  break;

  
      case "dropdown": {
  let dropdownOptions = [];

  // 1️⃣ Dynamic data from dataSource has FIRST priority
  if (element.dataSource && element.typeOfContent) {
    const dynamicKey = String(element.id);
const raw =
  store.dbdata?.[dynamicKey] ??
  store.dynamicValue?.[dynamicKey];


const dynamicList = Array.isArray(raw)
  ? raw
  : raw
  ? [raw]   // single thing → list of one
  : [];

    if (dynamicList && dynamicList.length > 0) {
      dropdownOptions = dynamicList.map((item) => ({
        label: element.dataSource.modifier ? evalModifier(item, element.dataSource.modifier) : item.name,
        value: item.id ?? item.name,
      }));
    }
  }

  // 2️⃣ Only if no dynamic data → fallback to staticValue
  if (dropdownOptions.length === 0 && element.staticValue && element.staticValue.length > 0) {
    dropdownOptions = element.staticValue.flatMap((opt) =>
      opt.value.split(",").map((v) => ({ label: v.trim(), value: v.trim() }))
    );
  }

  // Add empty option at the top
  dropdownOptions = [{ label: "", value: "" }, ...dropdownOptions];

  const selectedValue = getDynamicValue(element, parentData) || element.value;

  rendered = (
    <div style={{ position: "relative", display: "inline-block", width: element.style?.width || 200 }}>
      <div
        onClick={() => toggleDropdown(element.id)}
        style={{
          borderRadius: element.style?.borderRadius || 8,
          border: element.style?.border || "1px solid #ccc",
          cursor: "pointer",
          padding: "10px 12px",
          userSelect: "none",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 500,
        }}
      >
        <span>
          {dropdownOptions.find((o) => o.value === selectedValue)?.label || "Select ▼"}
        </span>
        <span
          style={{
            transform: openDropdownId === element.id ? "rotate(180deg)" : "rotate(0deg)",
            transition: "0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {openDropdownId === element.id && (
        <div
          style={{
            position: "absolute",
            marginTop: 4,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 4,
            minWidth: "100%",
            zIndex: 100,
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          {dropdownOptions.map((opt, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: 6,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              onClick={() => {
  setElementValue(element.id, opt.value);

  // 🔥 delegate DB filtering to store
  if (element.repeatingGroupId) {
    store.fetchFilteredData(
      element.id,
      opt.value,
      element.repeatingGroupId,
      projectSlug
    );
  }

  setOpenDropdownId(null);
}}

            >
              {opt.label || <span style={{ color: "#aaa" }}>—</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  break;
}

// Modifier helper
function evalModifier(item, modifier) {
  try {
    if (!modifier) return item.name || item.id;
    return Function("each_item", `return ${modifier}`)(item);
  } catch (err) {
    console.error("Modifier eval error:", err, modifier, item);
    return item.name || item.id;
  }
}

case "repeating_group": {
  const children = element.children || [];

  // Use element.id as key to match backend
  const dataKey = String(element.id);  
  const items = dbdata?.[dataKey];
if (!dbdata || !(dataKey in dbdata)) return null; // not fetched yet

if (Array.isArray(items) && items.length === 0) {
  return <div style={{ padding: 20, opacity: 0.6 }}>No results</div>;
}

  const direction = element.style?.flexDirection || "row";
  const isRow = direction === "row";

  const containerStyle = {
    display: "flex",
    flexDirection: direction,
    flexWrap: "wrap",
    gap: element.style?.gap || 20,
    justifyContent: element.style?.justifyContent,
    alignItems: element.style?.alignItems,
    overflowX: isRow ? "auto" : "visible",
    overflowY: isRow ? "visible" : "auto",
    width: "100%",
  };

  const itemStyle = {
    flex: isRow ? "0 0 auto" : "none",
    width: isRow ? element.itemWidth || "20%" : "100%",
    minWidth: isRow ? 150 : "auto",
    maxWidth: isRow ? 400 : "none",
    boxSizing: "border-box",
    borderRadius: element.itemStyle?.borderRadius || 12,
  };

  const template = children[0]; // template item
  return (
    <div style={containerStyle}>
      {items.map((item, idx) => (
        <div key={idx} style={itemStyle}>
          <PreviewRenderer element={template} parentData={item} />
        </div>
      ))}
    </div>
  );
}




      case "input": {
  // ✅ use dynamicValue from Zustand as the single source of truth
  const value = dynamicValue?.[String(element.id)] ?? "";

 const handleInputChange = (e) => {
  const newValue = e.target.value;
  setElementValue(element.id, newValue);

  store.fetchFilteredData(element.id, newValue, projectSlug);
};




  rendered = (
    <input
      id={String(element.id)}
      type={element.inputType || "text"}
      value={value} // ✅ directly from Zustand
      placeholder={getDynamicValue(element, currentItem) || element.placeholder || ""}
      onChange={handleInputChange}
      style={{
        borderRadius: style.borderRadius,
        border: style.border,
        width: style.width || "200px",
        outline: "none",
        ...style,
      }}
    />
  );
  break;
}



case "search": {
  const value = dynamicValue?.[String(element.id)] ?? "";

  rendered = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
      <input
        id={String(element.id)}
        type="text"
        value={value}                             // ✅ runtime state
        placeholder={
          getDynamicValue(element, currentItem) ||
          element.placeholder ||
          ""
        }
        onChange={(e) =>
          setElementValue(element.id, e.target.value) // ✅ triggers live search
        }
        style={{
          flexGrow: 1,
          borderRadius: 6,
          border: "1px solid #ccc",
          outline: "none",
          ...element.inputStyle,
        }}
      />
      {element.icon && (
        <span style={{ cursor: "pointer", fontSize: 20 }}>🔍</span>
      )}
    </div>
  );
  break;
}


      case "column-container": {
  // 1️⃣ Get data for children
  let dataForChildren = parentData || {};

  // 2️⃣ Render single container
  rendered = (
    <div
      key={element.id}
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "column",
        width: style.width || "100%",
        height: style.height || "auto",
        gap: style.gap || 12,
      }}
    >
      {(element.children || []).map((child, childIdx) => (
        <PreviewRenderer
          key={`${child.id}_${childIdx}`} // unique key per child
          element={{ ...child, parentFlexDirection: style.flexDirection }}
          parentData={dataForChildren}   // pass full array if products
        />
      ))}
    </div>
  );

  break;
}

 
        case "button":
  rendered = (
    <button
      onClick={async () => {
        console.log("LOGIN BUTTON ID:", element.id);
        // Trigger workflows
        await triggerWorkflow({ type: "element", scope: "element", event: "clicked" });

        // ✅ Open popup if this button should open one
        if (element.opensPopupId) {
          usePreviewStore.getState().openPopup(element.opensPopupId);
        }
      }}
      style={{
        ...style,
        display: "block",
        borderRadius: style.borderRadius || 8,
        cursor: "pointer",
        backgroundColor: style.backgroundColor || "#007BFF",
        color: style.color || "#fff",
        border: style.border || "none",
        fontSize: style.fontSize || 16,
        fontWeight: style.fontWeight || 500,
        fontFamily: style.fontFamily || "inherit",
        textAlign: style.textAlign || "center",
        alignSelf: style.alignSelf || "auto",
        width: style.width || "auto",
        minWidth: style.minWidth || "fit-content",
        flexShrink: style.flexShrink ?? 0,

          // ✅ ADD THESE
  paddingTop: style.paddingTop ? `${style.paddingTop}px` : undefined,
  paddingBottom: style.paddingBottom ? `${style.paddingBottom}px` : undefined,
  paddingLeft: style.paddingLeft ? `${style.paddingLeft}px` : undefined,
  paddingRight: style.paddingRight ? `${style.paddingRight}px` : undefined,

      }}
    >
      {getDynamicValue(element, currentItem) || element.value}
    </button>
  );
  break;


  case "text":
  rendered = (
    <div
    
      key={element.id}
      onClick={async () => {
        await triggerWorkflow({ type: "element", scope: "element", event: "clicked" });
      }}
      style={{
        ...finalStyle,
        display: "block",                  // wrapper acts as flex item
        alignSelf: style.alignSelf || "auto", // flex alignment works
        width: style.width || "auto",      // width flexible
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: style.fontSize || 16,
          fontWeight: style.fontWeight || 400,
          fontFamily: style.fontFamily || "inherit",
          fontStyle: style.fontStyle || "normal",
          textDecoration: style.textDecoration || "none",
          color: style.color || "#000",
          lineHeight: style.lineHeight || "normal",
          letterSpacing: style.letterSpacing || "normal",
          backgroundColor: style.backgroundColor || "transparent",
          marginTop: style.marginTop ? `${style.marginTop}px` : undefined,
          marginRight: style.marginRight ? `${style.marginRight}px` : undefined,
          marginBottom: style.marginBottom ? `${style.marginBottom}px` : undefined,
          marginLeft: style.marginLeft ? `${style.marginLeft}px` : undefined,
        }}
      >
        {getDynamicValue(element, currentItem)}
      </span>
    </div>
  );
  break;

  // ---------------- Navbar ----------------
  case "navbar": {
    const children = element.children || [];

    // Build clusters for links
    const groupedChildren = [];
    let buffer = [];
    children.forEach((child) => {
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

    const navbarDataList =
      element.typeOfContent && dbdata && element.id in dbdata
        ? dbdata[element.id]
        : [parentData || {}];

    rendered = navbarDataList.map((currentItem, idx) => (
      <div
        key={`${element.id}_${idx}`}
        style={{
          ...finalStyle,
          width: "100%",
          display: "flex",
          justifyContent: style.justifyContent || "space-between",
          alignItems: style.alignItems || "center",
          gap: style.gap || 16,
        }}
      >
        {groupedChildren.map((group, groupIndex) => {
          if (group.type !== "cluster") {
            return (
              <PreviewRenderer
                key={group.id + "_" + groupIndex}
                element={{ ...group, parentFlexDirection: style.flexDirection }}
                parentData={currentItem} // pass current record
              />
            );
          }

          return (
            <div key={"cluster_" + groupIndex} style={{ display: "flex", gap: "18px" }}>
              {group.items.map((link, i) => (
                <PreviewRenderer
                  key={link.id + "_" + i}
                  element={{ ...link, parentFlexDirection: style.flexDirection }}
                  parentData={currentItem} // pass current record
                />
              ))}
            </div>
          );
        })}
      </div>
    ));

    break;
  }

  // ---------------- Column Container ----------------


// ---------------- Row Container ----------------
case "row-container": {
  // Use dbdata if typeOfContent is set, fallback to parentData
  const dataList =
    element.typeOfContent && dbdata && element.id in dbdata
      ? Array.isArray(dbdata[element.id])
        ? dbdata[element.id]
        : [dbdata[element.id]]
      : parentData
      ? Array.isArray(parentData)
        ? parentData
        : [parentData]
      : [{}];

  // Render single row per record
  rendered = dataList.map((currentItem, idx) => (
    <div
      key={`${element.id}_${idx}`}
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "row",
        width: style.width || "100%",
        height: style.height || "auto",
        gap: style.gap || 12,
      }}
    >
      {(element.children || []).map((child, childIdx) => (
        <PreviewRenderer
          key={`${child.id}_${childIdx}_${idx}`}
          element={{ ...child, parentFlexDirection: style.flexDirection }}
          parentData={currentItem} // pass single record
        />
      ))}
    </div>
  ));
  break;
}

// ---------------- Card ----------------
case "card": {
  rendered = (
    <div
      style={{
        ...finalStyle,
        display: "flex",
        flexDirection: style.flexDirection || "column",
        gap: style.gap || 10,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        borderRadius: style.borderRadius || 12,
        boxShadow: style.boxShadow || "0 8px 20px rgba(0,0,0,0.15)",
        backgroundColor: style.backgroundColor || "#fff",
      }}
    >
      {(element.children || []).map((child) => (
        <PreviewRenderer
          key={child.id}
          element={child}
          parentData={parentData} // pass parent data
        />
      ))}
    </div>
  );
  break;
}

// ---------------- Header ----------------
case "header": {
  const dataList =
    element.typeOfContent && dbdata && element.id in dbdata
      ? Array.isArray(dbdata[element.id])
        ? dbdata[element.id]
        : [dbdata[element.id]]
      : parentData
      ? Array.isArray(parentData)
        ? parentData
        : [parentData]
      : [{}];

  rendered = dataList.map((currentItem, idx) => (
    <div
      key={`${element.id}_${idx}`}
      style={{
        ...finalStyle,
        display: style.display || "flex",
        flexDirection: style.flexDirection || "row",
        alignItems: style.alignItems || "center",
        justifyContent: style.justifyContent || "center",
        width: style.width || "100%",
        padding: style.padding ?? 0,
        backgroundColor: style.backgroundColor,
        color: style.color,
      }}
    >
      {(element.children || []).map((child) => {
        const childDataList =
          child.typeOfContent && dbdata && child.id in dbdata
            ? Array.isArray(dbdata[child.id])
              ? dbdata[child.id]
              : [dbdata[child.id]]
            : [currentItem];

        return childDataList.map((childItem, cIdx) => (
          <PreviewRenderer
            key={`${child.id}_${cIdx}`}
            element={{ ...child, parentFlexDirection: style.flexDirection }}
            parentData={childItem}
          />
        ));
      })}
    </div>
  ));
  break;
}

// ---------------- Banner ----------------
case "banner": {
  const dataList =
    element.typeOfContent && dbdata && element.id in dbdata
      ? Array.isArray(dbdata[element.id])
        ? dbdata[element.id]
        : [dbdata[element.id]]
      : parentData
      ? Array.isArray(parentData)
        ? parentData
        : [parentData]
      : [{}];

  rendered = dataList.map((currentItem, idx) => (
    <div
      key={`${element.id}_${idx}`}
      style={{
        ...finalStyle,
        width: "100%",
        minHeight: style.height || 160,
        backgroundImage: style.backgroundImage
          ? `url(${style.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        display: "flex",
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
      }}
    >
      {(element.children || []).map((child) => {
        const childDataList =
          child.typeOfContent && dbdata && child.id in dbdata
            ? Array.isArray(dbdata[child.id])
              ? dbdata[child.id]
              : [dbdata[child.id]]
            : [currentItem];

        return childDataList.map((childItem, cIdx) => (
          <PreviewRenderer
            key={`${child.id}_${cIdx}`}
            element={{ ...child, parentFlexDirection: style.flexDirection }}
            parentData={childItem}
          />
        ));
      })}
    </div>
  ));
  break;
}

  // ---------------- Repeating Group ----------------
  

 case "popup": {
  const isPopupVisible = openPopupId === element.id; // ✅ use value from top-level hook
  if (!isPopupVisible) return null;

  rendered = (
    <>
      {/* Overlay */}
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
        onClick={() => usePreviewStore.getState().closePopup()}
      />

      {/* Popup container */}
      <div
        style={{
          display: "flex",
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ AUTH ERROR MESSAGE */}
  {authError && (
    <div
      style={{
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        padding: "8px 12px",
        borderRadius: 6,
        fontSize: 14,
      }}
    >
      {authError}
    </div>
  )}
        {(element.children || []).map((child, i) => (
          <PreviewRenderer
            key={child.id + "_" + i}
            element={child}
            parentData={currentItem}
            projectId={projectId}
          />
        ))}
      </div>
    </>
  );
  break;
}

  case "logo":
      rendered = (
        <img
        onClick={async (e) => {
    e.preventDefault(); // prevent default navigation
    await triggerWorkflow({ type: "element", scope: "element", event: "clicked" });

  }}
          src={element.src || ""}
          alt={element.alt || "Logo"}
          style={{
            height: style.height || 40,
            width: style.width || "auto",
            objectFit: "contain",
            cursor: "pointer",
            ...style,
          }}
        />
      );
      break;

case "checkbox": {
  const item = currentItem || {};

  // Get value: store overrides DB
  const checkedValue = dynamicValue?.[element.id] ?? item[element.id] ?? false;

  // Label
  const labelValue =
    (element.labelDynamic
      ? getDynamicValue({ ...element, dynamicData: element.labelDynamic }, item)
      : null) || element.label || "Checkbox";

  const handleChange = (checked) => {
    usePreviewStore.setState((state) => ({
      dynamicValue: { ...state.dynamicValue, [element.id]: checked },
    }));

    // Update dbdata for repeating group or parent
    if (item && item.id) {
      const parentKey = element.parentId || element.id;
      if (dbdata[parentKey]) {
        dbdata[parentKey] = dbdata[parentKey].map((rec) =>
          rec.id === item.id ? { ...rec, [element.id]: checked } : rec
        );
      }
    }
  };

  rendered = (
    <label
      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", ...style }}
    >
      <input
        type="checkbox"
        checked={!!checkedValue}
        onChange={(e) => handleChange(e.target.checked)}
        style={{ width: style.boxSize || 18, height: style.boxSize || 18, cursor: "pointer" }}
      />
      <span style={{ fontSize: style.fontSize || 14 }}>{labelValue}</span>
    </label>
  );
  break;
}

    case "icon":
      rendered = (
        <span style={{ fontSize: style.fontSize || 20, color: style.color || "#000", ...style }}>
          {getDynamicValue(element, currentItem) || "⭐"}
        </span>
      );
      break;

  
case "image":
  rendered = (
    <img
      src={element.imageUrl || Cat17}
      style={{
        width: style.width || "100%",
        height: "auto",
        objectFit: style.objectFit || "contain",
        objectPosition: "center",
        alignSelf: style.alignSelf,
        borderRadius: style.borderRadius || 8,
        ...style,
      }}
    />
  );
  break;


    case "label":
      rendered = (
        <label
          style={{
            ...style,
            display: "inline-block",
            fontSize: style.fontSize || 14,
            fontWeight: style.fontWeight || 500,
            color: style.color || "#333",
            marginBottom: style.marginBottom || 6,
          }}
        >
          {getDynamicValue(element, currentItem) || element.value}
        </label>
      );
      break;

case "ratio":
  const ratioValue = style.ratio || "16:9";
  const [rw = 16, rh = 9] = ratioValue.split(":").map(Number); // default fallback
  const paddingTop = (rh / rw) * 100;

  rendered = (
    <div
      style={{
        position: "relative",
        width: style.width || "100%",
        paddingTop: `${paddingTop}%`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {(element.children || []).map((child) => (
          <PreviewRenderer
            key={child.id}
            element={{
              ...child,
              parentFlexDirection: style.flexDirection,
            }}
            parentData={currentItem} // pass current record
          />
        ))}
      </div>
    </div>
  );
  break;



    case "select":
  const selectOptions = element.options || [];
  const dynamicSelectOptionsRaw = getDynamicValue(element, currentItem);
  const dynamicSelectOptions = Array.isArray(dynamicSelectOptionsRaw)
    ? dynamicSelectOptionsRaw
    : selectOptions;

  rendered = (
    <select
      style={{
        borderRadius: style.borderRadius || 6,
        border: style.border || "1px solid #ccc",
        width: style.width || "100%",
        outline: "none",
        ...style,
      }}
    >
      {dynamicSelectOptions.map((opt, idx) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
  break;






   default:
  // If no children and no content, don't render the div
  if (!element.children || element.children.length === 0) return null;

  rendered = (
    <div
      style={{
        ...finalStyle,
        backgroundColor: finalStyle.backgroundColor || "transparent", // avoid grey
        minHeight: finalStyle.minHeight || 0, // avoid extra space
      }}
    >
      {element.children.map((child) => (
        <PreviewRenderer
          key={child.id}
          element={{ ...child, parentFlexDirection: style.flexDirection }}
          parentData={currentItem}
        />
      ))}
    </div>
  );

}
// ✅ Ensure workflows is an array
const safeWorkflows = Array.isArray(workflows) ? workflows : [];

// Check if this element has an onClick workflow
const hasClickWorkflow = safeWorkflows.some(
  (wf) => String(wf.elementId) === String(element.id) && wf.trigger === "onClick"
);

// Wrap rendered with clickable div when needed
if (hasClickWorkflow && element.type !== "link" && element.type !== "button") {
  return (
    <div onClick={() => triggerWorkflow("onClick")} style={{ cursor: "pointer" }}>
      {rendered}
    </div>
  );
}


// Default return
return (
  <>
    {!element.hidden && (
      <>
        {rendered} {/* button, link, input, or container */}
        {/* No eye button here */}
      </>
    )}
  </>
);


}

