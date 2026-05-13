import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';

export default function ContextMenu({ x, y, onClose, onSaveCustom }) {
  const selectedIds       = useStore(s => s.selectedIds);
  const groupSelected     = useStore(s => s.groupSelected);
  const ungroupSelected   = useStore(s => s.ungroupSelected);
  const duplicateSelected = useStore(s => s.duplicateSelected);
  const deleteSelected    = useStore(s => s.deleteSelected);
  const seats             = useStore(s => s.seats);

  const menuRef = useRef(null);

  const canGroup   = selectedIds.length >= 2;
  const canUngroup = seats.some(s => selectedIds.includes(s.id) && s.groupId);

  // Position — flip if too close to screen edge
  const menuW = 210, menuH = 200;
  const left = x + menuW > window.innerWidth  ? x - menuW : x;
  const top  = y + menuH > window.innerHeight ? y - menuH : y;

  // Close on outside mousedown or Escape
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    // Small delay so the mousedown that opened this menu doesn't close it
    const t = setTimeout(() => {
      window.addEventListener('mousedown', onDown);
      window.addEventListener('keydown', onKey);
    }, 80);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function run(fn) {
    fn();
    onClose();
  }

  return createPortal(
    <div ref={menuRef} style={{ ...cm.menu, left, top }}>
      {canGroup && (
        <Item icon="⛶" onClick={() => run(groupSelected)}>Group Selection</Item>
      )}
      {canUngroup && (
        <Item icon="⊹" onClick={() => run(ungroupSelected)}>Ungroup</Item>
      )}
      <Item icon="⧉" onClick={() => run(duplicateSelected)}>Duplicate</Item>
      <Divider />
      <Item icon="★" onClick={onSaveCustom}>Save as Custom Model…</Item>
      <Divider />
      <Item icon="✕" danger onClick={() => run(deleteSelected)}>Delete</Item>
    </div>,
    document.body
  );
}

function Item({ icon, children, onClick, danger }) {
  return (
    <button
      style={{ ...cm.item, ...(danger ? cm.itemDanger : {}) }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.background = danger ? '#450a0a' : '#334155'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={cm.icon}>{icon}</span>
      {children}
    </button>
  );
}

function Divider() {
  return <div style={cm.divider} />;
}

const cm = {
  menu: {
    position: 'fixed',
    zIndex: 2000,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '4px 0',
    minWidth: 200,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    userSelect: 'none',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 0.08s',
  },
  itemDanger: {
    color: '#fca5a5',
  },
  icon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
    opacity: 0.7,
    flexShrink: 0,
  },
  divider: {
    height: 1,
    background: '#334155',
    margin: '3px 0',
  },
};
