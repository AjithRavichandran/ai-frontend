// src/Canvas/utils/CanvastreeUtils.js
export const buildElementsMap = (node, map = {}) => {
  if (!node) return map;

  // Only map nodes that actually have IDs
  if (node.id) {
    map[node.id] = node;
  }

  // Walk children
  if (Array.isArray(node.children)) {
    node.children.forEach((child) =>
      buildElementsMap(child, map)
    );
  }

  // Walk pages
  if (Array.isArray(node.pages)) {
    node.pages.forEach((page) =>
      buildElementsMap(page, map)
    );
  }

  // ✅ NEW — walk global popups
  if (node.globalPopups) {
    buildElementsMap(node.globalPopups, map);
  }

  return map;
};


export const findNodeAndParent = (root, id, parent = null) => {
  if (!root) return null;

  // Match found at current node
  if (root.id === id) {
    return {
      node: root,
      parent,
      indexInParent: parent
        ? (parent.children || parent.pages || []).findIndex((el) => el.id === id)
        : null,
    };
  }

  // Check inside pages (if any)
  if (Array.isArray(root.pages)) {
    for (let i = 0; i < root.pages.length; i++) {
      const page = root.pages[i];
      const res = findNodeAndParent(page, id, root);
      if (res) return res;
    }
  }

  // Check inside children (if any)
  if (Array.isArray(root.children)) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      const res = findNodeAndParent(child, id, root);
      if (res) return res;
    }
  }

  // ✅ Check inside globalPopups if it exists
  if (root.globalPopups?.children) {
    for (let i = 0; i < root.globalPopups.children.length; i++) {
      const child = root.globalPopups.children[i];
      const res = findNodeAndParent(child, id, root.globalPopups);
      if (res) return res;
    }
  }

  return null;
};


// ✅ NEW: traverse up to find first ancestor with typeOfContent
export const findParentWithTypeOfContent = (root, id) => {
  // helper to find node anywhere by id
  const findNodeById = (node, searchId) => {
    if (!node) return null;
    if (node.id === searchId) return node;

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = findNodeById(child, searchId);
        if (found) return found;
      }
    }

    return null;
  };

  let node = findNodeById(root, id);
  if (!node) return null;

  while (node?.parentId) {
    const parent = findNodeById(root, node.parentId);
    if (!parent) break;
    if (parent.typeOfContent) return parent; // found the nearest parent with typeOfContent
    node = parent;
  }

  return null;
};
