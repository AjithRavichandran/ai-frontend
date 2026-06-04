export function triggerHandler(elementId, triggerObj, workflows = []) {
  if (!workflows.length) {
    console.log("No workflows available");
    return null;
  }

  console.log(
    "Looking for workflow for elementId:",
    elementId,
    "with trigger:",
    triggerObj
  );

  const workflow = workflows.find((wf) => {
    // Match either:
    // 1️⃣ Element-specific workflow
    const elementMatch = String(wf.elementId) === String(elementId);

    // 2️⃣ General workflow (elementId is null)
    const generalMatch = wf.elementId == null;

    const match =
      (elementMatch || generalMatch) && // ✅ allow general workflows
      wf.trigger &&
      wf.trigger.type === triggerObj.type &&
      wf.trigger.event === triggerObj.event;

    console.log(
      `Checking workflow: ${wf.id} -> elementId: ${wf.elementId}, trigger type: ${wf.trigger?.type}, event: ${wf.trigger?.event}, match: ${match}`
    );

    return match;
  });

  if (!workflow) console.warn("No matching workflow found!");
  return workflow;
}
