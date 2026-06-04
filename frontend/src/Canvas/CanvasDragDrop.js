import { useState, useEffect } from "react";
import { useCanvasStore } from "./CanvasStore";
import { findNodeAndParent } from "./utils/CanvastreeUtils";

export default function useCanvasDragDrop(pushToHistory, activePageId, setHasChanges, onEditIntent, scrollRef) {
  const { tree, setTree } = useCanvasStore();
  const [dragState, setDragState] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [highlightedContainerId, setHighlightedContainerId] = useState(null);

const activePage = tree?.pages?.find((p) => p.id === activePageId);
const isDisabled = !tree || !tree.pages || !activePage;

  // Checks if a node is a descendant of another
  const isDescendant = (parentNode, childId) => {
    if (!parentNode.children) return false;
    for (const c of parentNode.children) {
      if (c.id === childId) return true;
      if (isDescendant(c, childId)) return true;
    }
    return false;
  };

  const getContainerForNode = (nodeId) => {
    const res = findNodeAndParent(activePage, nodeId);
    return res?.node || null;
  };

useEffect(() => {
  if (!dragState || !scrollRef?.current || !activePage) return;

  const container = scrollRef.current;
  const threshold = 80;

  const onMouseMove = (e) => {
    const rect = container.getBoundingClientRect();

    // ABOVE canvas → move to TOP
    if (e.clientY < rect.top) {
      setDropIndicator({
        parentId: activePage.id,
        index: 0,
      });
    }

    // BELOW canvas → move to BOTTOM
    else if (e.clientY > rect.bottom) {
      setDropIndicator({
        parentId: activePage.id,
        index: activePage.children?.length || 0,
      });
    }
  };

  window.addEventListener("mousemove", onMouseMove);
  return () => window.removeEventListener("mousemove", onMouseMove);
}, [dragState, activePage, scrollRef]);


const onDragStart = (e, sourceParentId, sourceIndex, nodeId) => {
  if (isDisabled) return;
  e.stopPropagation();

  // 🔔 Notify editor that user is trying to modify canvas
  if (onEditIntent) {
    onEditIntent({
      type: "drag",
      nodeId,
      sourceParentId,
      sourceIndex,
    });
  }

  setDragState({ nodeId, sourceParentId, sourceIndex });
  setDropIndicator(null);
  setHighlightedContainerId(null);

  try {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ sourceParentId, sourceIndex, nodeId })
    );
    e.dataTransfer.effectAllowed = "move";
  } catch {}
};


  const onDragOver = (e, targetParentId, targetIndex) => {
    if (isDisabled || !dragState) return;
    e.preventDefault();
    e.stopPropagation();
    if (!dragState) return;

    const movedNode = getContainerForNode(dragState.nodeId);
    const targetNode = getContainerForNode(targetParentId);
    if (!movedNode || !targetNode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const offsetX = e.clientX - rect.left;

    const isTopHalf = offsetY < rect.height / 2;
    const isLeftHalf = offsetX < rect.width / 2;

    const flexDirection = targetNode.style?.flexDirection || "column";
    let computedIndex = targetIndex;
    if (flexDirection === "column") {
      computedIndex = isTopHalf ? targetIndex : targetIndex + 1;
    } else if (flexDirection === "row") {
      computedIndex = isLeftHalf ? targetIndex : targetIndex + 1;
    }

    const isContainer =
      targetNode.style?.display === "flex" &&
      (flexDirection === "row" || flexDirection === "column");

    const containerNode = isContainer
      ? targetNode
      : getContainerForNode(targetNode.parentId);

    if (!containerNode) return;

    if (
  dragState.nodeId === containerNode.id ||
  isDescendant(movedNode, containerNode.id)
) {

      setHighlightedContainerId(null);
      setDropIndicator(null);
      return;
    }

    setHighlightedContainerId(containerNode.id);
    setDropIndicator({
      parentId: containerNode.id,
      index: computedIndex,
    });
  };

  const onDragLeave = (targetParentId) => {
    if (isDisabled) return;
    if (highlightedContainerId === targetParentId) setHighlightedContainerId(null);
  };

  // Recursive function to update parentId for a node and its children
  const updateParentIdRecursively = (node, newParentId) => {
    node.parentId = newParentId;
    if (node.children && node.children.length) {
      node.children.forEach((child) => updateParentIdRecursively(child, node.id));
    }
  };

  const onDrop = (e, targetParentId, targetIndex) => {
    if (isDisabled) return;
    e.preventDefault();
    e.stopPropagation();

    let ds = dragState;
    if (!ds) {
      try {
        const payload = JSON.parse(
          e.dataTransfer.getData("application/json") || "{}"
        );
        if (payload && payload.nodeId !== undefined) ds = payload;
      } catch {}
    }
    if (!ds)
      return setDragState(null), setDropIndicator(null), setHighlightedContainerId(null);

    const clone = structuredClone(tree);
    const srcParentRes = findNodeAndParent(clone, ds.sourceParentId);
    const tgtParentRes = findNodeAndParent(clone, targetParentId);
    const movedNodeRes = findNodeAndParent(clone, ds.nodeId);

    if (!srcParentRes || !tgtParentRes || !movedNodeRes)
      return setDragState(null), setDropIndicator(null), setHighlightedContainerId(null);

    const srcParent = srcParentRes.node;
    const tgtParent = tgtParentRes.node;
    const moved = movedNodeRes.node;

    if (
  ds.nodeId === targetParentId ||
  isDescendant(moved, targetParentId)
)

      return setDragState(null), setDropIndicator(null), setHighlightedContainerId(null);

    if (!Array.isArray(srcParent.children)) srcParent.children = [];
    if (!Array.isArray(tgtParent.children)) tgtParent.children = [];

    const srcItems = [...srcParent.children];
    const tgtItems = srcParent.id === tgtParent.id ? srcItems : [...tgtParent.children];

    let from = Math.max(0, Math.min(srcItems.length - 1, ds.sourceIndex));
    let to = Math.max(0, Math.min(tgtItems.length, targetIndex));

    const [removed] = srcItems.splice(from, 1);
    if (!removed) return;

    if (srcParent.id === tgtParent.id && from < to) to -= 1;

    tgtItems.splice(to, 0, removed);

    // Update children arrays
    srcParent.children = srcParent.id === tgtParent.id ? tgtItems : srcItems;
    tgtParent.children = tgtItems;

    // ✅ Update parentId recursively and indexInParent
    updateParentIdRecursively(removed, tgtParent.id);
    tgtParent.children.forEach((child, i) => (child.indexInParent = i));
    if (srcParent.id !== tgtParent.id) {
      srcParent.children.forEach((child, i) => (child.indexInParent = i));
    }

    pushToHistory(structuredClone(tree), activePageId);
    setTree(clone);
    if (setHasChanges) setHasChanges(true);

    setDragState(null);
    setDropIndicator(null);
    setHighlightedContainerId(null);
  };

  return {
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    dropIndicator,
    highlightedContainerId,
  };
}
