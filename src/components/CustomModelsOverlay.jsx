import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { getTemplateBBox } from '../data/templates';

// ── tiny SVG preview ──────────────────────────────────────────────────────────
function ModelPreview({ seats, size = 100 }) {
  if (!seats?.length) return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={11} fill="#475569">empty</text>
    </svg>
  );
  const bb = getTemplateBBox(seats);
  const pad = 8;
  const scale = Math.min((size - pad * 2) / Math.max(bb.w, 1), (size - pad * 2) / Math.max(bb.h, 1), 2);
  const tx = size / 2 - ((bb.minX + bb.maxX) / 2) * scale;
  const ty = size / 2 - ((bb.minY + bb.maxY) / 2) * scale;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        {seats.map(s => {
          if (s.type === 'circle') return (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.r}
              fill={s.fill} stroke={s.stroke} strokeWidth={Math.max(0.5, s.strokeWidth / scale)} />
          );
          if (s.type === 'text') return (
            <text key={s.id} x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
              fontSize={s.fontSize} fill={s.fill}>{s.text}</text>
          );
          const hw = (s.width || 60) / 2, hh = (s.height || 40) / 2;
          return (
            <rect key={s.id} x={s.x - hw} y={s.y - hh} width={s.width || 60} height={s.height || 40}
              rx={2} fill={s.fill} stroke={s.stroke} strokeWidth={Math.max(0.5, s.strokeWidth / scale)} />
          );
        })}
      </g>
    </svg>
  );
}

// ── main overlay ──────────────────────────────────────────────────────────────
export default function CustomModelsOverlay({ onClose }) {
  const customModels    = useStore(s => s.customModels);
  const deleteCustomModel = useStore(s => s.deleteCustomModel);
  const addBulkSeats    = useStore(s => s.addBulkSeats);
  const [confirmDelete, setConfirmDelete] = useState(null); // model id

  function handlePlace(model) {
    const seats = model.seats.map(s => ({
      ...s,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      groupId: null,
    }));
    addBulkSeats(seats, true);
    onClose();
  }

  function handleDelete(id) {
    deleteCustomModel(id);
    setConfirmDelete(null);
  }

  return createPortal(
    <div style={co.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={co.modal}>
        <div style={co.header}>
          <span style={co.title}>Custom Models</span>
          <button style={co.close} onClick={onClose}>✕</button>
        </div>

        <div style={co.body}>
          {customModels.length === 0 ? (
            <div style={co.empty}>
              <div style={co.emptyIcon}>📦</div>
              <div style={co.emptyText}>No custom models yet</div>
              <div style={co.emptyHint}>
                Select objects on the canvas, right-click, and choose<br />
                <em>"Save as Custom Model"</em> to save them here.
              </div>
            </div>
          ) : (
            <div style={co.grid}>
              {customModels.map(m => (
                <div key={m.id} style={co.card}>
                  <div style={co.previewBox}>
                    <ModelPreview seats={m.seats} size={100} />
                  </div>
                  <div style={co.cardInfo}>
                    <div style={co.cardName} title={m.name}>{m.name}</div>
                    <div style={co.cardMeta}>{m.seats.length} objects</div>
                  </div>
                  <div style={co.cardActions}>
                    <button style={co.btnPlace} onClick={() => handlePlace(m)}>Place</button>
                    {confirmDelete === m.id ? (
                      <div style={co.confirmRow}>
                        <button style={co.btnConfirmDel} onClick={() => handleDelete(m.id)}>Delete?</button>
                        <button style={co.btnCancelDel} onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button style={co.btnDel} onClick={() => setConfirmDelete(m.id)}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={co.footer}>
          <button style={co.btnClose} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const co = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: 12, width: 640, maxWidth: '95vw', maxHeight: '88vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid #334155', flexShrink: 0,
  },
  title: { color: '#f1f5f9', fontSize: 16, fontWeight: 700 },
  close: {
    background: 'none', border: 'none', color: '#64748b',
    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px',
  },
  body: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '48px 20px', textAlign: 'center',
  },
  emptyIcon:  { fontSize: 48 },
  emptyText:  { color: '#e2e8f0', fontSize: 16, fontWeight: 600 },
  emptyHint:  { color: '#64748b', fontSize: 13, lineHeight: 1.6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 14,
  },
  card: {
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
  previewBox: {
    background: '#1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 8,
  },
  cardInfo: { padding: '8px 10px 4px' },
  cardName: {
    color: '#e2e8f0', fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  cardMeta: { color: '#64748b', fontSize: 11, marginTop: 2 },
  cardActions: {
    display: 'flex', gap: 6, padding: '6px 10px 10px',
    alignItems: 'center',
  },
  btnPlace: {
    flex: 1, padding: '6px 0',
    background: '#2563eb', border: '1px solid #3b82f6',
    borderRadius: 6, color: '#fff',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'inherit',
  },
  btnDel: {
    padding: '5px 8px', background: 'none',
    border: '1px solid #475569', borderRadius: 6,
    color: '#64748b', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit',
  },
  confirmRow: { display: 'flex', gap: 4 },
  btnConfirmDel: {
    padding: '5px 7px', background: '#7f1d1d',
    border: '1px solid #dc2626', borderRadius: 6,
    color: '#fca5a5', cursor: 'pointer', fontSize: 11,
    fontFamily: 'inherit',
  },
  btnCancelDel: {
    padding: '5px 7px', background: '#334155',
    border: '1px solid #475569', borderRadius: 6,
    color: '#94a3b8', cursor: 'pointer', fontSize: 11,
    fontFamily: 'inherit',
  },
  footer: {
    borderTop: '1px solid #334155', padding: '12px 20px',
    display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
  },
  btnClose: {
    padding: '8px 24px', background: '#334155',
    border: '1px solid #475569', borderRadius: 7,
    color: '#cbd5e1', cursor: 'pointer', fontSize: 13,
    fontFamily: 'inherit',
  },
};
