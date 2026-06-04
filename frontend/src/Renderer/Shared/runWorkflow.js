// src/RuntimeRoot/RuntimeWorkflow/runWorkflow.js
import { triggerHandler } from "./triggerHandler";
import { triggerConditions } from "./triggerCondition";
import { runPreviewActions } from "../PreviewRoot/PreviewWorkflow/PreviewActionExecutor";
import { runLiveActions } from "../LiveRoot/LiveWorkflow/LiveActionExecutor";

export async function runWorkflow(
  elementId,
  trigger,
  workflows = [],
  allPages = [],
  setCurrentPage,
  appData,
  navigate,
  projectSlug,
) {
const isPreview =
  window.location.pathname.split("/")[1] === "preview";

const mode = isPreview ? "preview" : "live";

  const slugify = (text) =>
     text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "");
 
   // 1️⃣ Find workflow
   const workflow = triggerHandler(elementId, trigger, workflows);
   if (!workflow) return;
 
   // 2️⃣ Check conditions
  // Correct
 const passed = await triggerConditions(
   workflow.conditions || [],
   navigate,      // pass navigate
   allPages,      // pass all pages
   projectSlug,   // pass project slug
   slugify        // pass slugify function
 );
 
   if (!passed) return;
 
  // 3️⃣ Execute actions
  if (mode === "preview") {
  await runPreviewActions(
    workflow.actions || [],
    allPages,
    setCurrentPage,
    appData,
    navigate,
    projectSlug,
    slugify
  );
} else {
  await runLiveActions(
    workflow.actions || [],
    allPages,
    setCurrentPage,
    appData,
    navigate,
    projectSlug,
    slugify
  );
}

}
