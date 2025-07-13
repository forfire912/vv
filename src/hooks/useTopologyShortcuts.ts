import { useEffect } from "react";

export default function useTopologyShortcuts(
  { onDelete, onUndo, onRedo }: { onDelete: () => void; onUndo: () => void; onRedo: () => void }
) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        onUndo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        onRedo();
        e.preventDefault();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        onDelete();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDelete, onUndo, onRedo]);
}