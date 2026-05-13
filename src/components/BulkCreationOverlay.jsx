import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { createSeat } from '../utils/seatFactory';

// ── layout helper ─────────────────────────────────────────────────────────────
function buildPositions(count, arrangement, cols, spacing, seatW, seatH) {
  const pos = [];
  for (let i = 0; i < count; i++) {
    if (arrangement === 'row') {
      pos.push({ x: i * (seatW + spacing), y: 0 });
    } else if (arrangement === 'col') {
      pos.push({ x: 0, y: i * (seatH + spacing) });
    } else {
      const c = i % cols, r = Math.floor(i / cols);
      pos.push({ x: c * (seatW + spacing), y: r * (seatH + spacing) });
    }
  }
  if (!pos.length) return pos;
  const cx = (Math.min(...pos.map(p => p.x)) + Math.max(...pos.map(p => p.x))) / 2;
  const cy = (Math.min(...pos.map(p => p.y)) + Math.max(...pos.map(p => p.y))) / 2;
  return pos.map(p => ({ x: p.x - cx, y: p.y - cy }));
}

// ── small SVG preview ─────────────────────────────────────────────────────────
function BulkPreview({ type, positions, seatW, seatH, seatR, fill, stroke }) {
  if (!positions.length) return null;
  const pad = 14;
  const xs = positions.map(p => p.x), ys = positions.map(p => p.y);
  const minX = Math.min(...xs) - seatW / 2 - pad;
  const minY = Math.min(...ys) - seatH / 2 - pad;
  const rawW = Math.max(...xs) - Math.min(...xs) + seatW + pad * 2;
  const rawH = Math.max(...ys) - Math.min(...ys) + seatH + pad * 2;
  const scale = Math.min(260 / rawW, 160 / rawH, 1);
  const svgW = rawW * scale, svgH = rawH * scale;

  return (
    <svg width={svgW} height={svgH} style={{ display: 'block', margin: 'auto' }}>
      <g transform={`scale(${scale}) translate(${-minX},${-minY})`}>
        {positions.map((p, i) =>
          type === 'circle'
            ? <circle key={i} cx={p.x} cy={p.y} r={seatR} fill={fill} stroke={stroke} strokeWidth={1.5} />
            : type === 'text'
            ? <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
                fontSize={seatR * 1.4} fill={fill}>T</text>
            : <rect key={i} x={p.x - seatW / 2} y={p.y - seatH / 2} width={seatW} height={seatH}
                rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />
        )}
      </g>
    </svg>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function BulkCreationOverlay({ type, onClose }) {
  const addBulkSeats = useStore(s => s.addBulkSeats);

  const defaultSize = type === 'circle' ? 32 : type === 'text' ? 18 : type === 'square' ? 50 : 70;
  const [qty,         setQty]         = useState(10);
  const [arrangement, setArrangement] = useState('grid');
  const [cols,        setCols]        = useState(5);
  const [spacing,     setSpacing]     = useState(14);
  const [size,        setSize]        = useState(defaultSize);
  const [fill,        setFill]        = useState(type === 'circle' ? '#8b5cf6' : '#3b82f6');
  const [stroke,      setStroke]      = useState(type === 'circle' ? '#6d28d9' : '#1d4ed8');

  const seatW = type === 'circle' ? size : type === 'rect' ? size : size;
  const seatH = type === 'circle' ? size : type === 'rect' ? Math.round(size * 0.6) : size;
  const seatR = size / 2;

  const positions = useMemo(
    () => buildPositions(Math.min(qty, 80), arrangement, cols, spacing, seatW, seatH),
    [qty, arrangement, cols, spacing, seatW, seatH]
  );

  function handlePlace() {
    const allPositions = buildPositions(qty, arrangement, cols, spacing, seatW, seatH);
    const seats = allPositions.map(({ x, y }) => {
      const base = createSeat(type, x, y);
      if (type === 'circle')  return { ...base, r: size / 2,                   fill, stroke };
      if (type === 'square')  return { ...base, width: size, height: size,      fill, stroke };
      if (type === 'rect')    return { ...base, width: size, height: seatH,     fill, stroke };
      if (type === 'text')    return { ...base, fontSize: size,                 fill };
      return base;
    });
    addBulkSeats(seats, false);
    onClose();
  }

  const typeLabel = { square: 'Square', rect: 'Rectangle', circle: 'Circle', text: 'Text' }[type] ?? type;

  return createPortal(
    <div style={o.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={o.panel}>
        {/* Header */}
        <div style={o.header}>
          <span style={o.title}>Bulk Create — {typeLabel}</span>
          <button style={o.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={o.body}>
          {/* ── Form column ── */}
          <div style={o.formCol}>
            <Field label="Quantity">
              <NumIn value={qty} onChange={setQty} min={1} max={500} />
            </Field>

            <Field label="Arrangement">
              <select style={o.select} value={arrangement} onChange={e => setArrangement(e.target.value)}>
                <option value="grid">Grid</option>
                <option value="row">Single row</option>
                <option value="col">Single column</option>
              </select>
            </Field>

            {arrangement === 'grid' && (
              <Field label="Columns">
                <NumIn value={cols} onChange={setCols} min={1} max={30} />
              </Field>
            )}

            <Field label="Spacing (px)">
              <NumIn value={spacing} onChange={setSpacing} min={0} max={300} />
            </Field>

            <Field label={type === 'circle' ? 'Diameter' : type === 'text' ? 'Font size' : 'Size'}>
              <NumIn value={size} onChange={setSize} min={8} max={300} />
            </Field>

            {type !== 'text' && (
              <Field label="Fill color">
                <input type="color" style={o.colorIn} value={fill} onChange={e => setFill(e.target.value)} />
              </Field>
            )}
            {type !== 'text' && (
              <Field label="Stroke color">
                <input type="color" style={o.colorIn} value={stroke} onChange={e => setStroke(e.target.value)} />
              </Field>
            )}
            {type === 'text' && (
              <Field label="Text color">
                <input type="color" style={o.colorIn} value={fill} onChange={e => setFill(e.target.value)} />
              </Field>
            )}
          </div>

          {/* ── Preview column ── */}
          <div style={o.previewCol}>
            <div style={o.previewTitle}>Preview{qty > 80 ? ' (first 80)' : ''}</div>
            <div style={o.previewBox}>
              <BulkPreview
                type={type} positions={positions}
                seatW={seatW} seatH={seatH} seatR={seatR}
                fill={fill} stroke={stroke}
              />
            </div>
            <div style={o.previewCount}>{qty} {typeLabel.toLowerCase()}{qty !== 1 ? 's' : ''} total</div>
          </div>
        </div>

        {/* Footer */}
        <div style={o.footer}>
          <button style={o.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={o.placeBtn} onClick={handlePlace}>
            Place {qty} {typeLabel}{qty !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── small helpers ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={o.field}>
      <span style={o.fieldLabel}>{label}</span>
      {children}
    </div>
  );
}

function NumIn({ value, onChange, min, max }) {
  return (
    <input
      type="number" style={o.input}
      value={value} min={min} max={max}
      onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n))); }}
    />
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const o = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  panel: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    width: 640,
    maxWidth: '95vw',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px',
    borderBottom: '1px solid #334155',
  },
  title: { color: '#f1f5f9', fontSize: 15, fontWeight: 700 },
  closeBtn: {
    background: 'none', border: 'none', color: '#64748b',
    fontSize: 16, cursor: 'pointer', padding: '2px 6px', borderRadius: 5,
    fontFamily: 'inherit',
  },
  body: {
    display: 'flex', gap: 16, padding: 18, flex: 1, overflowY: 'auto',
  },
  formCol: {
    display: 'flex', flexDirection: 'column', gap: 10, width: 220, flexShrink: 0,
  },
  previewCol: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
  },
  previewTitle: {
    color: '#475569', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  previewBox: {
    flex: 1, background: '#0f172a', borderRadius: 8,
    border: '1px solid #1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 160, overflow: 'hidden', padding: 8,
  },
  previewCount: { color: '#475569', fontSize: 11, textAlign: 'center' },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '12px 18px', borderTop: '1px solid #334155',
  },
  field: { display: 'flex', alignItems: 'center', gap: 8 },
  fieldLabel: { color: '#94a3b8', fontSize: 12, width: 100, flexShrink: 0 },
  input: {
    flex: 1, background: '#0f172a', border: '1px solid #334155',
    borderRadius: 5, color: '#e2e8f0', padding: '5px 8px',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  },
  select: {
    flex: 1, background: '#0f172a', border: '1px solid #334155',
    borderRadius: 5, color: '#e2e8f0', padding: '5px 8px',
    fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
  },
  colorIn: {
    flex: 1, height: 32, padding: 2,
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 5, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '8px 20px', background: '#334155', color: '#cbd5e1',
    border: '1px solid #475569', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  placeBtn: {
    padding: '8px 22px', background: '#2563eb', color: '#fff',
    border: '1px solid #3b82f6', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
};
