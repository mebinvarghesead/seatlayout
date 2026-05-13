import React, { useCallback } from 'react';
import { useStore } from '../store/useStore';

const FONTS = [
  { value: 'sans-serif',             label: 'Sans-serif' },
  { value: 'serif',                  label: 'Serif' },
  { value: 'monospace',              label: 'Monospace' },
  { value: 'system-ui',              label: 'System UI' },
  { value: 'Georgia, serif',         label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Impact, fantasy',        label: 'Impact' },
];

export default function PropertiesPanel() {
  const mode        = useStore(s => s.mode);
  const selectedIds = useStore(s => s.selectedIds);
  const seats       = useStore(s => s.seats);
  const updateSeat  = useStore(s => s.updateSeat);
  const deleteSeat  = useStore(s => s.deleteSeat);

  if (mode === 'free' || selectedIds.length === 0) return null;

  if (selectedIds.length > 1) {
    return (
      <div style={p.panel}>
        <h3 style={p.title}>Selection</h3>
        <div style={p.meta}>{selectedIds.length} seats selected</div>
        <p style={p.hint}>Use Group / Ungroup in the toolbar.</p>
      </div>
    );
  }

  const seat = seats.find(s => s.id === selectedIds[0]);
  if (!seat) return null;

  return <SingleSeatPanel seat={seat} updateSeat={updateSeat} deleteSeat={deleteSeat} />;
}

function SingleSeatPanel({ seat, updateSeat, deleteSeat }) {
  const {
    id, type, x, y, width, height, r,
    text, fill, stroke, strokeWidth,
    label, labelFontSize, labelColor, labelFontWeight,
    fontSize, fontFamily, fontWeight,
    rotation,
  } = seat;

  const num = useCallback((key, val) => {
    const n = parseFloat(val);
    if (!isNaN(n)) updateSeat(id, { [key]: n });
  }, [id, updateSeat]);

  const str = useCallback((key, val) => updateSeat(id, { [key]: val }), [id, updateSeat]);

  const toggle = useCallback((key, a, b) => {
    updateSeat(id, { [key]: seat[key] === a ? b : a });
  }, [id, seat, updateSeat]);

  return (
    <div style={p.panel}>
      <div style={p.header}>
        <h3 style={p.title}>Properties</h3>
        <span style={p.badge}>{type}</span>
      </div>

      {/* ── Position ── */}
      <Section label="Position">
        <Row label="X"><Num value={Math.round(x)} onChange={v => num('x', v)} /></Row>
        <Row label="Y"><Num value={Math.round(y)} onChange={v => num('y', v)} /></Row>
      </Section>

      {/* ── Size ── */}
      {(type === 'square' || type === 'rect') && (
        <Section label="Size">
          <Row label="Width" ><Num value={Math.round(width)}  onChange={v => num('width',  v)} min={10} /></Row>
          <Row label="Height"><Num value={Math.round(height)} onChange={v => num('height', v)} min={10} /></Row>
        </Section>
      )}
      {type === 'circle' && (
        <Section label="Size">
          <Row label="Radius"><Num value={Math.round(r)} onChange={v => num('r', v)} min={5} /></Row>
        </Section>
      )}

      {/* ── Text element properties ── */}
      {type === 'text' && (
        <Section label="Text">
          <Row label="Content">
            <input
              type="text"
              style={{ ...p.input, flex: 1 }}
              value={text || ''}
              onChange={e => str('text', e.target.value)}
              placeholder="Enter text…"
            />
          </Row>
          <Row label="Font size">
            <Num value={fontSize || 18} onChange={v => num('fontSize', v)} min={6} max={200} />
          </Row>
          <Row label="Font">
            <select
              style={p.select}
              value={fontFamily || 'sans-serif'}
              onChange={e => str('fontFamily', e.target.value)}
            >
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Row>
          <Row label="Style">
            <ToggleBtn
              active={(fontWeight || 'normal') === 'bold'}
              onClick={() => toggle('fontWeight', 'bold', 'normal')}
              title="Bold"
            >B</ToggleBtn>
          </Row>
          <Row label="Color">
            <ColorPick value={fill} onChange={v => str('fill', v)} />
          </Row>
        </Section>
      )}

      {/* ── Shape label ── */}
      {type !== 'text' && (
        <Section label="Label text">
          <Row label="Text">
            <input
              type="text"
              style={{ ...p.input, flex: 1 }}
              value={label || ''}
              onChange={e => str('label', e.target.value)}
              placeholder="Double-click shape to edit…"
            />
          </Row>
          <Row label="Font size">
            <Num value={labelFontSize || 13} onChange={v => num('labelFontSize', v)} min={6} max={200} />
          </Row>
          <Row label="Color">
            <ColorPick value={labelColor || '#ffffff'} onChange={v => str('labelColor', v)} />
          </Row>
          <Row label="Style">
            <ToggleBtn
              active={(labelFontWeight || 'normal') === 'bold'}
              onClick={() => toggle('labelFontWeight', 'bold', 'normal')}
              title="Bold"
            >B</ToggleBtn>
          </Row>
        </Section>
      )}

      {/* ── Shape appearance ── */}
      <Section label="Appearance">
        {type !== 'text' && (
          <Row label="Fill"><ColorPick value={fill} onChange={v => str('fill', v)} /></Row>
        )}
        {type !== 'text' && (
          <Row label="Stroke"><ColorPick value={stroke} onChange={v => str('stroke', v)} /></Row>
        )}
        {type !== 'text' && (
          <Row label="S. width">
            <Num value={strokeWidth || 0} onChange={v => num('strokeWidth', v)} min={0} max={20} />
          </Row>
        )}
      </Section>

      {/* ── Transform ── */}
      <Section label="Transform">
        <Row label="Rotation">
          <Num value={Math.round(rotation || 0)} onChange={v => num('rotation', v)} min={-360} max={360} />
        </Row>
      </Section>

      <button style={p.deleteBtn} onClick={() => deleteSeat(id)}>
        Delete Seat
      </button>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={p.section}>
      <div style={p.sectionLabel}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={p.row}>
      <span style={p.rowLabel}>{label}</span>
      {children}
    </div>
  );
}

function Num({ value, onChange, min, max }) {
  return (
    <input
      type="number" style={p.input}
      value={value} min={min} max={max}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function ColorPick({ value, onChange }) {
  return (
    <input
      type="color"
      style={p.colorInput}
      value={toHex(value)}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function ToggleBtn({ active, onClick, children, title }) {
  return (
    <button
      title={title}
      style={{ ...p.toggleBtn, ...(active ? p.toggleBtnActive : {}) }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function toHex(color) {
  if (!color || color === 'none') return '#000000';
  return color;
}

// ── styles ────────────────────────────────────────────────────────────────────
const p = {
  panel: {
    width: 220,
    height: '100%',
    background: '#1e293b',
    borderLeft: '1px solid #334155',
    padding: '12px 11px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: 600,
  },
  badge: {
    padding: '2px 8px',
    background: '#1d4ed8',
    color: '#bfdbfe',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  meta: { color: '#94a3b8', fontSize: 12 },
  hint: { color: '#64748b', fontSize: 11 },
  section: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 7,
    padding: '8px 9px',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 2,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  rowLabel: {
    color: '#94a3b8',
    fontSize: 11,
    width: 58,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#e2e8f0',
    padding: '4px 7px',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    minWidth: 0,
  },
  select: {
    flex: 1,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#e2e8f0',
    padding: '4px 6px',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
  },
  colorInput: {
    flex: 1,
    height: 28,
    padding: 2,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    cursor: 'pointer',
  },
  toggleBtn: {
    width: 28, height: 26,
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 5,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    background: '#1d4ed8',
    borderColor: '#3b82f6',
    color: '#fff',
  },
  deleteBtn: {
    marginTop: 4,
    padding: '8px 0',
    background: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #dc2626',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'inherit',
  },
};
