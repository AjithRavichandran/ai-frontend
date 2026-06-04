// expressionEngine.js
export function resolveExpression(expr, context) {
  // Example: expr = "parent_group_Product.price"
  const parts = expr.split(".");

  let value = context;

  for (let p of parts) {
    if (!value) return null;
    value = value[p];
  }

  return value;
}

export function buildExpression(source, field) {
  return `${source}.${field}`;
}
