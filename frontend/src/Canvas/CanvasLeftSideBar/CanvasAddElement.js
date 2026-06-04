// src/Canvas/CanvasLeftSideBar/CanvasAddElement.js
import { findNodeAndParent,  buildElementsMap } from "../utils/CanvastreeUtils";
let lastImageIndex = -1;

export const placeElement = ({
  type,
  tree,
  setTree,
  activePageId,
  selectedElementId,
  pushToHistory,
  setHasChanges,
}) => {

  const activePage = tree.pages.find((p) => p.id === activePageId);
  if (!activePage) return;

  // Save to undo history
  pushToHistory(structuredClone(tree), activePageId);

  // Find selected element as insertion parent if any
  const { node: selectedNode } = findNodeAndParent(tree, selectedElementId) || {};
  
  // Fallback parent: column-container or page
  const rootColumn = (activePage.children || []).find(
    (child) => child.type === "column-container"
  );
  const fallbackParent = rootColumn || activePage;
// Find active popup on the page
// find popup ANYWHERE on the page
const elementsMap = buildElementsMap(activePage);

const activePopup = Object.values(elementsMap).find(
  (el) => el.type === "popup" && el.isOpen === true
);
const canContainChildren = (el) =>
  ["page","navbar",  "column-container", "row-container", "card", "popup", "repeating_group"]
  .includes(el.type);

// ✅ Declare first
let insertParent = fallbackParent;

// 🔵 Selected element ALWAYS wins
if (selectedNode && canContainChildren(selectedNode)) {
  insertParent = selectedNode;
}
// 🟣 Otherwise active popup
else if (activePopup) {
  insertParent = activePopup;
}

const createAuthButton = (label, parentId, hidden = true) => ({
  id: crypto.randomUUID(),
  type: "button",
  parentId,
  hidden,
  value: label,
  style: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 14,
    paddingRight: 14,
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    alignSelf: "center",
  },
  children: [],
});

  // Default new element structure
  const newElement = {
    id: crypto.randomUUID(),
    type,
    parentId: insertParent.id,
    indexInParent: insertParent.children?.length || 0,
    style: {},
    children: [],
  };

  // Set default styles and values per type
  switch (type) {


case "image": {
  const imagePool = [
    "live/do.jfif",
    "live/image1.jpg",
    "live/image3.jpg",
    "live/image7.jpg",
    "live/image8.jpg",
    "live/Kitten Portrait.jpg",
  ];

  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * imagePool.length);
  } while (imagePool.length > 1 && randomIndex === lastImageIndex);

  lastImageIndex = randomIndex;

  newElement.src = imagePool[randomIndex];
  newElement.alt = "placeholder";

  newElement.style = {
    objectFit: "cover",
    borderRadius: 4,
    alignSelf: "flex-start",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
  };

  break;
}



case "radio": {
  const existingRadios =
    insertParent.children?.filter(el => el.type === "radio") || [];

  const nextNumber = existingRadios.length + 1;

  newElement.value = `Option ${nextNumber}`;
  newElement.checked = false;
  newElement.name = `radio-${insertParent.id}`; // group radios

  newElement.style = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    alignSelf: "flex-start",
    cursor: "pointer",
  };
  break;
}


  case "checkbox": {
  const existingCheckboxes =
    insertParent.children?.filter(el => el.type === "checkbox") || [];

  const nextNumber = existingCheckboxes.length + 1;

  newElement.value = `Checkbox ${nextNumber}`;
  newElement.checked = false;

  newElement.style = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    alignSelf: "flex-start",
    cursor: "pointer",
  };
  break;
}

  case "dropdown":
  newElement.value = "Option 1";
  newElement.options = ["Option 1", "Option 2", "Option 3"];
  newElement.children = null;
  newElement.style = {
    width: 200,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 14,
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
  };
  break;

case "datepicker":
  newElement.value = ""; // no date selected by default
  newElement.children = null;

  newElement.style = {
    width: 200,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    border: "1px solid #d1d5db",
    borderRadius: 4,
    fontSize: 14,
    backgroundColor: "#ffffff",
    color: "#111827",
    alignSelf: "flex-start",
    cursor: "pointer",
  };
  break;


    case "text":
      newElement.value = "New Text";
      newElement.style = {
        fontSize: 16,
        fontWeight: 600,
        color: "#1a202c",
        textAlign: "center",
        alignSelf: "flex-start",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 0,
        paddingRight: 0,
      };
      break;

  case "input":
      newElement.value = "";
      newElement.children = null;
      newElement.style = {
        width: 200,
        paddingTop: 6,
        paddingBottom: 6,
        paddingLeft: 8,
        paddingRight: 8,
        border: "1px solid #d1d5db",
        borderRadius: 4,
        fontSize: 14,
        alignSelf: "flex-start",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      };
      break;
        case "card":
  newElement.style = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    
    // Important width controls
    width: "100%",
    maxWidth: 420,
    minWidth: 220,

    alignSelf: "flex-start",
  };
  break;

        case "popup":
  newElement.style = {
    backgroundColor: "#ffffff",
    border: "1px solid #ccc",
    borderRadius: 8,

    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 8,

    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",

    width: "auto",
    height: "auto",
    minWidth: 280,
    minHeight: 120,

    zIndex: 1000,
    overflow: "auto",
  };

  newElement.isOpen = true;
  newElement.children = [];
  break;



    case "button":
      newElement.value = "Click Me";
      newElement.style = {
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: "#3b82f6",
        color: "#fff",
        borderRadius: 4,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        alignSelf: "flex-start",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      };
      break;

    case "row-container":
      newElement.style = {
        display: "flex",
        flexDirection: "row",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        backgroundColor: "#f3f4f6",
        justifyContent: "flex-start",
        alignItems: "stretch",
      };
      break;

    case "column-container":
      newElement.style = {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        backgroundColor: "#f9fafb",
        justifyContent: "flex-start",
        alignItems: "stretch",
      };
      break;

  

    case "repeating_group":
      newElement.style = {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        backgroundColor: "#ffffffff",
        justifyContent: "flex-start",
        alignItems: "stretch",
        minHeight: 120,
        border: "1px dashed #d4a017",
      };
      break;



    default:
      newElement.value = type;
      newElement.style = {
        fontSize: 14,
        color: "#1a202c",
        alignSelf: "flex-start",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      };
      break;
  }

  // Add the new element to the correct parent
  insertParent.children = insertParent.children || [];
  insertParent.children.push(newElement);

  // Update tree and mark changes
  setTree({ ...tree });
  setHasChanges(true);

return {
  newElement,
  insertParent,
};
};
