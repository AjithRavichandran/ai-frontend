export function getConditionOperators(field) {
  if (!field) return [];

  /* ---------------- CURRENT USER ---------------- */
  if (field.type === "current_user") {
    return [
      { id: "is_logged_in", label: "is logged in", unary: true },
      { id: "is_logged_out", label: "is logged out", unary: true },
    ];
  }

  /* ---------------- SEARCH ---------------- */
  if (field.type === "search") {
    return [
      { id: "exists", label: "exists", unary: true },
    ];
  }

  /* ---------------- INPUT ELEMENTS ---------------- */
  if (field.elementType === "input") {
    if (["email", "password"].includes(field.inputType)) {
      return [
        { id: "is_empty", label: "is empty", unary: true },
        { id: "is_not_empty", label: "is not empty", unary: true },
        { id: "is_valid", label: "is valid", unary: true },
        { id: "is_not_valid", label: "is not valid", unary: true },
      ];
    }

    return [
      { id: "is_empty", label: "is empty", unary: true },
      { id: "is_not_empty", label: "is not empty", unary: true },
      { id: "contains", label: "contains", unary: false },
      { id: "not_contains", label: "doesn't contain", unary: false },
    ];
  }

  /* ---------------- CHECKBOX ---------------- */
  if (field.elementType === "checkbox") {
    return [
      { id: "is_checked", label: "is checked", unary: true },
      { id: "is_not_checked", label: "is not checked", unary: true },
    ];
  }

  /* ---------------- DROPDOWN / SELECT ---------------- */
  if (
    field.elementType === "dropdown" ||
    field.elementType === "select"
  ) {
    return [
      { id: "is", label: "is", unary: false },
      { id: "is_not", label: "is not", unary: false },
    ];
  }

  return [];
}
