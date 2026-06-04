//CanvasnormalizeStyleKeys.js

export function normalizeStyleKeys(style = {}) {
  const normalized = {};
  for (const key in style) {
    if (Object.hasOwn(style, key)) {
      const camelCaseKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      normalized[camelCaseKey] = style[key];
    }
  }
  return normalized;
}
