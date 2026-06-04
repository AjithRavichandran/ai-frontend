// src/Canvas/CanvasProperties/resolveExpressionOutput.js
export function resolveExpressionOutput({
  dataSource,
  selectedElement,
  datatypes,
}) {
  if (!dataSource?.mode) {
    return { status: "empty", isList: false };
  }

  // ✅ Current User → always valid, always single
  if (dataSource.mode === "currentUser") {
    return {
      status: "valid",
      isList: false,
      type: "users",
    };
  }

  // 🔍 Do a search for
  if (dataSource.mode === "search") {
    const isList = !dataSource.modifier;

    // ❌ Context mismatch (list used in non-RG)
    if (
      selectedElement?.type !== "repeating_group" &&
      isList
    ) {
      return {
        status: "invalid",
        isList: true,
        reason: "LIST_CONTEXT_MISMATCH",
      };
    }

    // ❌ TYPE OF CONTENT mismatch (IMPORTANT)
    if (
      selectedElement?.typeOfContent &&
      dataSource.type &&
      selectedElement.typeOfContent !== dataSource.type
    ) {
      return {
        status: "invalid",
        isList,
        reason: "TYPE_MISMATCH",
      };
    }

    // ✅ Valid search
    return {
      status: "valid",
      isList,
      type: dataSource.type,
    };
  }

  return { status: "empty", isList: false };
}
