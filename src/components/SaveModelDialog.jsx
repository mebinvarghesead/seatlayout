import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';

export default function SaveModelDialog({ onClose }) {
  const selectedIds    = useStore(s => s.selectedIds);
  const seats          = useStore(s => s.seats);
  const saveCustomModel = useStore(s => s.saveCustomModel);

  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const selectedSeats = seats.filter(s => selectedIds.includes(s.id));

  function handleSave() {
    if (!selectedSeats.length) return;
    saveCustomModel(name || 'Custom Model', selectedSeats);
    onClose();
  }

  return createPortal(
    <div style={sd.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sd.dialog}>
        <div style={sd.header}>
          <span style={sd.title}>Save as Custom Model</span>
          <button style={sd.close} onClick={onClose}>✕</button>
        </div>
        <div style={sd.body}>
          <p style={sd.info}>
            Saving <strong style={{ color: '#e2e8f0' }}>{selectedSeats.length}</strong> object{selectedSeats.length !== 1 ? 's' : ''} as a reusable custom model.
          </p>
          <label style={sd.label}>Model name</label>
          <input
            ref={inputRef}
            style={sd.input}
            placeholder="e.g. VIP Table, Booth Section…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            maxLength={60}
          />
        </div>
        <div style={sd.footer}>
          <button style={sd.btnCancel} onClick={onClose}>Cancel</button>
          <button style={sd.btnSave} onClick={handleSave} disabled={!selectedSeats.length}>
            Save Model
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const sd = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2100,
  },
  dialog: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 10,
    width: 380, maxWidth: '94vw',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid #334155',
  },
  title: { color: '#f1f5f9', fontSize: 15, fontWeight: 700 },
  close: {
    background: 'none', border: 'none', color: '#64748b',
    fontSize: 16, cursor: 'pointer', padding: '2px 6px',
  },
  body: { padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10 },
  info:  { color: '#64748b', fontSize: 13, margin: 0 },
  label: { color: '#94a3b8', fontSize: 12 },
  input: {
    background: '#0f172a', border: '1px solid #475569',
    borderRadius: 7, color: '#e2e8f0',
    padding: '9px 12px', fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '12px 18px', borderTop: '1px solid #334155',
  },
  btnCancel: {
    padding: '8px 20px', background: '#334155',
    border: '1px solid #475569', borderRadius: 7,
    color: '#cbd5e1', cursor: 'pointer', fontSize: 13,
    fontFamily: 'inherit',
  },
  btnSave: {
    padding: '8px 22px', background: '#2563eb',
    border: '1px solid #3b82f6', borderRadius: 7,
    color: '#fff', cursor: 'pointer', fontSize: 13,
    fontWeight: 600, fontFamily: 'inherit',
  },
};
