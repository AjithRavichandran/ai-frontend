import { useState, useCallback } from "react";

export default function useCanvasUndoRedo() {
  const [history, setHistory] = useState({});
  const [future, setFuture] = useState({});

  const MAX_HISTORY = 50;

  // Push snapshot
  const pushToHistory = useCallback((state, key) => {
    setHistory((h) => {
      const stack = h[key] || [];

      // avoid duplicate snapshots
      if (
        stack.length &&
        JSON.stringify(stack[stack.length - 1]) === JSON.stringify(state)
      ) {
        return h;
      }

      return {
        ...h,
        [key]: [...stack, state].slice(-MAX_HISTORY),
      };
    });

    // clear redo stack
    setFuture((f) => ({ ...f, [key]: [] }));
  }, []);

  // Undo
const handleUndo = useCallback(
  (key, current, setState, setHasChanges) => {
    const stack = history[key] || [];
    if (!stack.length) return;

    const previous = stack[stack.length - 1];

    // move current → future
    setFuture((f) => ({
      ...f,
      [key]: [current, ...(f[key] || [])],
    }));

    // remove last history entry
    setHistory((h) => ({
      ...h,
      [key]: stack.slice(0, -1),
    }));

    // apply previous state
    setState(previous);
    if (setHasChanges) setHasChanges(true);
  },
  [history]
);


  // Redo
 const handleRedo = useCallback(
  (key, current, setState, setHasChanges) => {
    const stack = future[key] || [];
    if (!stack.length) return;

    const next = stack[0];

    // push current → history
    setHistory((h) => ({
      ...h,
      [key]: [...(h[key] || []), current].slice(-MAX_HISTORY),
    }));

    // remove first future entry
    setFuture((f) => ({
      ...f,
      [key]: stack.slice(1),
    }));

    // apply next state
    setState(next);
    if (setHasChanges) setHasChanges(true);
  },
  [future]
);


  const getPageHistory = useCallback(
    (key) => history[key] || [],
    [history]
  );

  const getPageFuture = useCallback(
    (key) => future[key] || [],
    [future]
  );

  return {
    pushToHistory,
    handleUndo,
    handleRedo,
    getPageHistory,
    getPageFuture,
  };
}
