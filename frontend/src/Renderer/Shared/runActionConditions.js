/**
 * Evaluates action-level "Only When" conditions
 * Works for Preview + Live automatically
 */

import { usePreviewStore } from "../PreviewRoot/PreviewStore";
import { useLiveStore } from "../LiveRoot/LiveStore";

/* ================================================== */
/* Main evaluator                                     */
/* ================================================== */

export function runActionConditions(conditions = []) {
  if (!conditions.length) return true;

  // 🔥 Auto-detect runtime mode
  const isPreview =
    window.location.pathname.split("/")[1] === "preview";

  const store = isPreview ? usePreviewStore : useLiveStore;

const state = store.getState();

console.log("STATE sessionId:", state.sessionId);
console.log("STATE currentUser:", state.currentUser);

// ✅ auto detect correct key
const sessionKeys = Object.keys(state.sessionId || {});
const key = sessionKeys.find(k =>
  k.endsWith(isPreview ? "_preview" : "_live")
);

console.log("Auto-detected KEY:", key);

const runtimeTree = state.runtimeTree;
const dynamicValue = state.dynamicValue;

const sessionId = state.sessionId?.[key] ?? null;
const currentUser = state.currentUser?.[key] ?? null;


  for (const condition of conditions) {
    const { source, field, operator } = condition;
    const normalizedOp = normalizeOperator(operator);

    /* ================= CURRENT USER ================= */

    if (source === "current_user") {
      const isWholeUserCheck = field == null;

      const passed = evaluateCurrentUserCondition({
        field,
        operator: normalizedOp,
        currentUser,
        sessionId,
        isWholeUserCheck,
      });

      if (!passed) return false;
    }

    /* ================= ELEMENT ================= */

    if (source === "element") {
      const passed = evaluateElementCondition({
        field,
        operator: normalizedOp,
        runtimeTree,
        dynamicValue,
      });

      if (!passed) return false;
    }
  }

  return true;
}

/* ================================================== */
/* Helpers                                            */
/* ================================================== */

function normalizeOperator(op = "") {
  return String(op).trim().toLowerCase().replace(/\s+/g, "_");
}

/* ================= CURRENT USER ================= */

function evaluateCurrentUserCondition({
  field,
  operator,
  currentUser,
  sessionId,
  isWholeUserCheck,
}) {
  switch (operator) {
    case "is_logged_in":
    case "is_not_empty":
      return isWholeUserCheck
        ? !!sessionId
        : !!currentUser?.[field];

    case "is_logged_out":
    case "is_empty":
      return isWholeUserCheck
        ? !sessionId
        : !currentUser?.[field];

    case "is":
      return currentUser?.[field] === true;

    case "is_not":
      return currentUser?.[field] === false;

    default:
      console.warn("Unknown current user operator:", operator);
      return false;
  }
}

/* ================= ELEMENT ================= */

function evaluateElementCondition({
  field,
  operator,
  runtimeTree,
  dynamicValue,
}) {
  const key = String(field);

  // Prefer dynamic runtime value
  let value =
    dynamicValue?.[key] ??
    (() => {
      const el = findNode(runtimeTree?.pages || [], key);
      return el ? getElementValue(el) : null;
    })();

  if (typeof value === "string") value = value.trim();

  switch (operator) {
    case "is_empty":
      return value === null || value === undefined || value === "";

    case "is_not_empty":
      return value !== null && value !== undefined && value !== "";

    default:
      console.warn("Unknown element operator:", operator);
      return false;
  }
}

function getElementValue(element) {
  if (!element) return null;

  switch (element.type) {
    case "checkbox":
    case "radio":
      return !!element.checked;

    default:
      return element.value ?? "";
  }
}

/* ================= TREE SEARCH ================= */

function findNode(nodes, id) {
  for (const node of nodes) {
    if (String(node.id) === String(id)) return node;

    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }

  return null;
}
