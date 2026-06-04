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

// src/constants/operators.js
export const OPERATORS = {
  TEXT: [
    { label: "=", value: "eq" },
    { label: "!=", value: "neq" },
    { label: "contains", value: "contains" },
    { label: "doesn't contain", value: "not_contains" },
    { label: "starts with", value: "starts_with" },
    { label: "ends with", value: "ends_with" },
    { label: "is empty", value: "is_empty" },
    { label: "isn't empty", value: "not_empty" }
  ],

  NUMBER: [
    { label: "=", value: "eq" },
    { label: "!=", value: "neq" },
    { label: "<", value: "lt" },
    { label: ">", value: "gt" },
    { label: "≤", value: "lte" },
    { label: "≥", value: "gte" },
    { label: "is empty", value: "is_empty" },
    { label: "isn't empty", value: "not_empty" }
  ],

  EMAIL: [
    { label: "equals", value: "eq" },
    { label: "contains", value: "contains" }
  ],

  YESNO: [
    { label: "is yes", value: "is_yes" },
    { label: "is no", value: "is_no" }
  ]
};
