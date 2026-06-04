// src/Canvas/CanvasWorkFlow/WorkflowTrigger.js
import React from "react";

export default function WorkflowTrigger({
  wf,
  workflowIndex,
  updateWorkflow,
  getWorkflowSelectableElements,
  pages,
  tree,

}) {
  return (
    <>
      {/* TRIGGER TYPE SELECTOR */}
      <div className="section-card">
        <div className="section-title">Trigger Type</div>
        <select
          value={wf.trigger.type}
          onChange={(e) => {
            const type = e.target.value;

            // Only reset event if the type changed
            const event =
              type !== wf.trigger.type
                ? type === "general"
                  ? "page_loaded"
                  : "clicked"
                : wf.trigger.event; // keep existing event if type didn't change

            updateWorkflow(workflowIndex, {
              ...wf,
              trigger: {
                ...wf.trigger,
                type,
                event,
              },
              elementId: type === "element" ? wf.elementId : null,
            });
          }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full bg-white shadow-sm"
        >
          <option value="general">General</option>
          <option value="element">Element</option>
        </select>
      </div>

      {/* GENERAL TRIGGERS */}
      {wf.trigger.type === "general" && (
        <div className="section-card mt-2">
          <div className="section-title">General Trigger</div>
          <select
            value={wf.trigger.event}
            onChange={(e) =>
              updateWorkflow(workflowIndex, {
                ...wf,
                trigger: { ...wf.trigger, event: e.target.value },
              })
            }
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full bg-white shadow-sm"
          >
            <option value="page_loaded">Page is loaded</option>
            <option value="user_logged_in">User is logged in</option>
            <option value="user_logged_out">User is logged out</option>
            <option value="every_n_seconds">Do every N seconds</option>
            <option value="condition_true">Do when condition is true</option>
          </select>
        </div>
      )}

      {/* ELEMENT TRIGGERS */}
      {wf.trigger.type === "element" && (
        <div className="section-card mt-2">
          <div className="section-title">Element Trigger</div>
          <select
            value={wf.trigger.event}
            onChange={(e) =>
              updateWorkflow(workflowIndex, {
                ...wf,
                trigger: { ...wf.trigger, event: e.target.value, scope: "element" },
              })
            }
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full bg-white shadow-sm"
          >
            <option value="clicked">Element is clicked</option>
            <option value="input_changed">Input value changed</option>
            <option value="popup_opened">Popup is opened</option>
            <option value="popup_closed">Popup is closed</option>
            <option value="element_error">Element error running workflow</option>
          </select>

          {/* Show element selector only for element triggers */}
          {!["popup_opened", "popup_closed"].includes(wf.trigger.event) && (
            <div className="mt-2">
              <select
                value={wf.elementId || ""}
                onChange={(e) => {


                  const selectedId = e.target.value;
                  const selectedEl = getWorkflowSelectableElements(
                    wf.pageId,
                    pages,
                    tree
                  ).find((el) => el.id === selectedId);

                  updateWorkflow(workflowIndex, {
                    ...wf,
                    elementId: selectedId,
                    elementType: selectedEl?.elementType || "",
                  });
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full bg-white shadow-sm"
              >
                <option value="">Select element...</option>
                {getWorkflowSelectableElements(wf.pageId, pages, tree).map((el) => (
                  <option key={el.id} value={el.id}>
                    {el.displayName} ({el.elementType})
                    {el.scope === "global" ? " 🌍" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </>
  );
}
