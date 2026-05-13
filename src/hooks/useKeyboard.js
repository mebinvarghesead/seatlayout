import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboard() {
  const setMode       = useStore(s => s.setMode);
  const deleteSelected = useStore(s => s.deleteSelected);
  const clearSelection = useStore(s => s.clearSelection);
  const undo          = useStore(s => s.undo);
  const redo          = useStore(s => s.redo);
  const groupSelected  = useStore(s => s.groupSelected);
  const ungroupSelected = useStore(s => s.ungroupSelected);

  useEffect(() => {
    const handler = e => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z') { e.preventDefault(); undo(); }
      else if (ctrl && e.key === 'y') { e.preventDefault(); redo(); }
      else if (ctrl && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); }
      else if (ctrl && e.key === 'g') { e.preventDefault(); groupSelected(); }
      else if (ctrl && e.shiftKey && e.key === 'G') { e.preventDefault(); ungroupSelected(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); }
      else if (e.key === 'Escape') {
        clearSelection();
        const { mode } = useStore.getState();
        if (mode === 'placement') setMode('pick');
      }
      else if (e.key === 'f' || e.key === 'F') setMode('free');
      else if (e.key === 'p' || e.key === 'P') setMode('pick');
      else if (e.key === 'a' || e.key === 'A') setMode('placement');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setMode, deleteSelected, clearSelection, undo, redo, groupSelected, ungroupSelected]);
}
