// src/Canvas/CanvasLeftSideBar/CanvasWorkFlow/CanvasworkFlows.js

import React, { useState } from "react";
import { buildElementsMap } from "../../utils/CanvastreeUtils";
import ActionSidePanel from "./ActionSidePanel";
import WorkflowActions from "./WorkflowActions";
import WorkflowConditions from "./WorkflowTriggerConditions";
import WorkflowTrigger from "./WorkflowTrigger";

export default function Workflows({ workflows, setWorkflows, pages,tree,datatypes}) {
  
const [actionPanel, setActionPanel] = React.useState({
  open: false,
  wfIndex: null,
  actionIndex: null,
});


const collectElementsRecursively = (node, scope, result) => {
  if (!node) return;

  // Skip backdrop / invisible containers
  if (node.id === "overlay_backdrop") return;

  if (node.type && node.type !== "container") {
    result.push({
      id: node.id,
      elementType: node.type,
      displayName: node.value || node.name || node.id,
      scope,
    });
  }

  if (node.children?.length) {
    node.children.forEach(child =>
      collectElementsRecursively(child, scope, result)
    );
  }
};

const [activeTab, setActiveTab] = useState("trigger");
const getWorkflowSelectableElements = (pageId, pages, tree) => {
  const result = [];

  // 1️⃣ Page elements (page + page popups)
  const page = pages.find(p => p.id === pageId);
  if (page) {
    collectElementsRecursively(page, "page", result);
  }

  // 2️⃣ Global popup elements (IMPORTANT FIX)
  if (tree?.globalPopups?.children) {
    tree.globalPopups.children.forEach(node => {
      // only traverse actual popups
      if (node.type === "popup") {
        collectElementsRecursively(node, "global", result);
      }
    });
  }

  return result;
};

const buildInlineOptions = (pageId, pages, tree) => {
  const elements = getWorkflowSelectableElements(pageId, pages, tree).map(el => ({
    id: el.id,
    type: "element",
    elementType: el.elementType,
    displayName: el.displayName,
  }));

  return [
    ...elements,

    // ✅ Data Sources (TOP LEVEL ONLY)
    {
      id: "current_user",
      type: "current_user",
      displayName: "Current User",
    },
    {
      id: "do_search",
      type: "search",
      displayName: "Do a Search",
    },
    {
      id: "custom_text",
      type: "custom",
      displayName: "Custom Text",
    },
  ];
};


const getInlineElementOptions = (pageId, pages, tree) => {
  return getWorkflowSelectableElements(pageId, pages, tree).map((el) => ({
    value: `{{${el.id}}}`,
    label: `${el.displayName} (${el.elementType}) ${
      el.scope === "global" ? "🌍" : ""
    }`,
  }));
};


// Get all popups, including global ones
const getAllPopups = () => {
  const result = [];

  // 📄 Page popups (recursive)
  pages.forEach((page) => {
    collectElementsRecursively(page, "page", result);
  });

  // 🌍 Global popups (recursive)
  if (tree?.globalPopups?.children) {
    tree.globalPopups.children.forEach((popup) => {
      collectElementsRecursively(popup, "global", result);
    });
  }

  // Keep only popups / modals
  return result.filter(
    (el) => el.elementType === "popup" || el.elementType === "modal"
  );
};



const addWorkflow = () => {
  // Find existing workflow IDs starting with 'w' and extract the number
  const existingNumbers = workflows
    .map(wf => {
      if (!wf.id) return 0;
      const match = String(wf.id).match(/^w(\d+)$/);
      return match ? Number(match[1]) : 0;
    });

  // Compute next number
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

  const newWorkflow = {
    id: `w${nextNumber}`,  // friendly sequential ID
    pageId: pages?.[0]?.id || null,
    pageName: pages?.[0]?.name || "New Workflow",

    trigger: {
      type: "",
      scope: "",
      event: "",
    },

    elementId: null,
    conditions: [],
    actions: [],
    description: "",
  };

  setWorkflows([...workflows, newWorkflow]);
};


  const updateWorkflow = (index, updated) => {
    setWorkflows(workflows.map((wf, i) => (i === index ? updated : wf)));
  };

  const removeWorkflow = (index) => {
    setWorkflows(workflows.filter((_, i) => i !== index));
  };

  const updateAction = (wfIndex, actionIndex, updatedAction) => {
    const wf = workflows[wfIndex];
    const updatedActions = wf.actions.map((a, i) =>
      i === actionIndex ? updatedAction : a
    );
    updateWorkflow(wfIndex, { ...wf, actions: updatedActions });
  };

  const removeAction = (wfIndex, actionIndex) => {
    const wf = workflows[wfIndex];
    const updatedActions = wf.actions.filter((_, i) => i !== actionIndex);
    updateWorkflow(wfIndex, { ...wf, actions: updatedActions });
  };

const addAction = (wfIndex) => {
  const wf = workflows[wfIndex];

  const newAction = {
    id: Date.now(),
    category: "",
    actionType: "",

    // 🔽 DATA ACTION SUPPORT
    thingType: "",     // selected datatype
    fieldsMap: {},     // values per field

    // existing fields
    email: {
      source: null,
      property: null,
      operators: [],
      returnType: null
    },

    password: {
      source: null,
      property: null,
      operators: [],
      returnType: null
    },

    targetPageId: "",
    targetElementId: "",
    dataSource: ""
  };

  updateWorkflow(wfIndex, {
    ...wf,
    actions: [...wf.actions, newAction],
  });
};


 const addCondition = (wfIndex) => {
  const wf = workflows[wfIndex];

  const newCond = {
    field: "",
    operator: "",
    value: ""
  };

  updateWorkflow(wfIndex, {
    ...wf,
    conditions: [...wf.conditions, newCond],
  });
};


  return (
   <div
  className="p-6 bg-gray-100 min-h-screen transition-all duration-300"
  style={{
  paddingRight:
    actionPanel.open && window.innerWidth >= 1024 ? 280 : 0,
}}

>

      {/* INLINE DESIGN STYLES */}
      <style>{`
        .section-card {
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 1rem;
          background: #fafafa;
          box-shadow: inset 0 0 6px rgba(0,0,0,0.04);
        }
        .section-title {
          font-weight: 600;
          font-size: .85rem;
          letter-spacing: .5px;
          color: #374151;
          text-transform: uppercase;
          margin-bottom: .5rem;
        }
      `}</style>

<div className="flex items-center justify-between mb-4">
  <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Workflows</h2>
  <div className="relative left-[-10px]">
    <button
      onClick={addWorkflow}
      className="bg-blue-600 text-white px-5 py-2.5 rounded-xl shadow hover:bg-blue-700 transition text-sm font-medium"
    >
      + Add Workflow
    </button>
  </div>
</div>




{workflows.length > 0 ? (
  <div className="overflow-auto w-full flex justify-center bg-gray-100 p-4 rounded-xl">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center max-w-[1400px] w-full">
      {workflows.map((wf, i) => (
        <div
  key={wf.id}
  className="
    relative
    bg-white/90
    backdrop-blur
    rounded-3xl
    p-6
    flex
    flex-col
    gap-5
    w-full
    max-w-md
    border-blue-200/60
  hover:border-blue-300/80
    shadow-[0_8px_30px_rgba(0,0,0,0.06)]
    hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]
    transition-all
    duration-300
  "
>

  
          {/* Title */}
<div className="flex items-center justify-between w-full pb-2 border-b border-gray-100">            <div className="relative w-full">
              <select
                value={wf.pageId}
                onChange={(e) => {
                  const selectedPage = pages.find(
                    (p) => p.id === Number(e.target.value)
                  );
                  updateWorkflow(i, {
                    ...wf,
                    pageId: selectedPage.id,
                    pageName: selectedPage.name,
                    elementId: null,
                  });
                }}
                className="text-lg font-semibold text-gray-900 w-full bg-transparent focus:outline-none text-center border-none appearance-none pr-10 cursor-pointer"
              >
                {pages?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button
  onClick={() => removeWorkflow(i)}
  className="
    ml-3
    h-8 w-8
    flex items-center justify-center
    rounded-full
    text-red-500
    hover:text-red-600
    hover:bg-red-50
    transition
  "
>
  ✕
</button>
          </div>

          {/* TRIGGER */}
          <WorkflowTrigger
            wf={wf}
            workflowIndex={i}
            updateWorkflow={updateWorkflow}
            getWorkflowSelectableElements={getWorkflowSelectableElements}
            pages={pages}
            tree={tree}
          />

          {/* Description */}
          <textarea
            placeholder="Workflow description..."
            value={wf.description}
            onChange={(e) =>
              updateWorkflow(i, { ...wf, description: e.target.value })
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 w-full shadow-sm focus:ring-1 focus:ring-blue-400"
            rows={2}
          />

          {/* Conditions */}
          <WorkflowConditions
            wf={wf}
            workflowIndex={i}
            updateWorkflow={updateWorkflow}
            addCondition={addCondition}
            availableFields={buildInlineOptions(wf.pageId, pages, tree)}
            datatypes={datatypes}
          />

          {/* Actions */}
          <WorkflowActions
            wf={wf}
            wfIndex={i}
            addAction={addAction}
            removeAction={removeAction}
            updateAction={updateAction}
            setActionPanel={setActionPanel}
            availableFields={buildInlineOptions(wf.pageId, pages, tree)}
            getWorkflowSelectableElements={getWorkflowSelectableElements}
            pages={pages}
            tree={tree}
            datatypes={datatypes}
          />
        </div>
      ))}
    </div>
  </div>
) : (
  <div className="flex items-center justify-center h-64 text-gray-500 italic text-lg">
    No workflows defined
  </div>
)}

    <ActionSidePanel
  actionPanel={actionPanel}
  setActionPanel={setActionPanel}
  workflows={workflows}
  pages={pages}
  tree={tree}
  updateAction={updateAction}
  updateWorkflow={updateWorkflow}
  getWorkflowSelectableElements={getWorkflowSelectableElements}
  getAllPopups={getAllPopups}
  buildInlineOptions={buildInlineOptions}
  datatypes={datatypes}
/>


    </div>
  );
}
