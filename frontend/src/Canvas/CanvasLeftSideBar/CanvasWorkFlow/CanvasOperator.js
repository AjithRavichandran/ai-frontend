// src/Canvas/CanvasProperties/CanvasOperator.js

// Operator sets based on field type
export const textOperators = [
  "=",
  "!=",
  "is in",
  "isn't in",
  "contains",
  "doesn't contain",
  "is empty",
  "isn't empty",
  "starts with",
  "ends with"
];

export const numberOperators = [
  "=",
  "!=",
  "<",
  ">",
  "≤",
  "≥",
  "is empty",
  "isn't empty",
  "is in",
  "isn't in"
];

export const emailOperators = [
  "= (equals)",
  "contains"
];

// Determine operator list based on selected field type
export const getOperatorsForField = (fieldName, fields = []) => {
  // Prevent crashes
  if (!fieldName || !Array.isArray(fields)) return [];

  const field = fields.find((f) => f.name === fieldName);
  if (!field) return [];

  switch (field.type) {
    case "text":
      return textOperators;
    case "number":
      return numberOperators;
    case "email":
      return emailOperators;
    default:
      return textOperators; // fallback
  }
};
