import { findNodeAndParent } from "../../Canvas/utils/CanvastreeUtils";
import { usePreviewStore } from "../PreviewRoot/PreviewStore";
import { useLiveStore } from "../LiveRoot/LiveStore";

/**
 * Universal condition runner (Preview + Live)
 */
export async function triggerConditions(
  conditions = [],
  navigate,
  allPages = [],
  projectSlug,
  slugify
) {
  if (!conditions.length) return true;

  // 🔁 Auto detect mode
  const isPreview =
    window.location.pathname.split("/")[1] === "preview";

  const store = isPreview ? usePreviewStore : useLiveStore;
  const state = store.getState();

  const {
    sessionId,
    currentUser,
    runtimeTree,
    dynamicValue,
  } = state;

  /* ---------------- RUNTIME KEY ---------------- */

  const sessionKeys = Object.keys(sessionId || {});
  const runtimeKey = sessionKeys.find((k) =>
    k.endsWith(isPreview ? "_preview" : "_live")
  );

  const runtimeSessionId = sessionId?.[runtimeKey] ?? null;
  const runtimeCurrentUser = currentUser?.[runtimeKey] ?? null;

  /* ---------------- HELPERS ---------------- */

  const normalizeOperator = (op = "") =>
    String(op).trim().toLowerCase().replace(/\s+/g, "_");

  /* ---------------- MAIN LOOP ---------------- */

  for (const condition of conditions) {
    const { type, operator, value, field, expectedValue } = condition;
    const normalizedOperator = normalizeOperator(operator);
    const isWholeUserCheck = value == null;

    /* ==================================================
       CURRENT USER
    ================================================== */

    if (type === "current_user") {
      switch (normalizedOperator) {
        case "is_logged_in":
        case "is_not_empty":
          if (isWholeUserCheck) {
            if (!runtimeSessionId) return false;
          } else {
            if (!runtimeCurrentUser?.[value]) return false;
          }
          break;

        case "is_logged_out":
        case "is_empty":
          if (isWholeUserCheck) {
            if (runtimeSessionId) return false;
          } else {
            if (runtimeCurrentUser?.[value]) return false;
          }
          break;

        case "is":
          if (runtimeCurrentUser?.[value] !== true) return false;
          break;

        case "is_not":
          if (runtimeCurrentUser?.[value] === true) return false;
          break;

        default:
          console.warn("Unknown current_user operator:", operator);
          return false;
      }
    }

    /* ==================================================
       ELEMENT
    ================================================== */

    else if (type === "element") {
      const elementNode =
        findNodeAndParent(runtimeTree?.pages || [], field)?.node;

      if (!elementNode) {
        console.warn("Element not found:", field);
        return false;
      }

      // 🔥 dynamic value always wins
      let elementValue =
        dynamicValue?.[field] ??
        (elementNode.type === "checkbox" ||
        elementNode.type === "radio"
          ? !!elementNode.checked
          : elementNode.value ?? "");

      if (typeof elementValue === "string") {
        elementValue = elementValue.trim();
      }

      switch (normalizedOperator) {
        case "is_empty":
          if (
            elementValue !== null &&
            elementValue !== undefined &&
            elementValue !== "" &&
            elementValue !== false
          )
            return false;
          break;

        case "is_not_empty":
          if (
            elementValue === null ||
            elementValue === undefined ||
            elementValue === "" ||
            elementValue === false
          )
            return false;
          break;

        case "is":
          if (elementValue !== expectedValue) return false;
          break;

        case "is_not":
          if (elementValue === expectedValue) return false;
          break;

        default:
          console.warn("Unknown element operator:", operator);
          return false;
      }
    }
  }

  return true;
}
