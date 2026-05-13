import React, { useCallback, useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [breakpoint]);
  return mobile;
}

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
  const isMobile    = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasSelection = mode !== 'free' && selectedIds.length > 0;

  // Close sheet when selection is cleared
  useEffect(() => {
    if (!hasSelection) setSheetOpen(false);
  }, [hasSelection]);

  if (!hasSelection) return null;

  if (isMobile) {
    return (
      <>
        {/* Floating button — always visible when something is selected */}
        {!sheetOpen && (
          <button style={p.fab} onClick={() => setSheetOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            Properties
          </button>
        )}

        {/* Bottom sheet */}
        {sheetOpen && (
          <div style={p.mobileSheet}>
            <div style={p.mobileHandle} />
            <div style={p.mobileHeader}>
              <span style={p.title}>Properties</span>
              <button style={p.mobileClose} onClick={() => setSheetOpen(false)}>✕</button>
            </div>
            <div style={p.mobileBody}>
              <PanelContent
                selectedIds={selectedIds} seats={seats}
                updateSeat={updateSeat} deleteSeat={deleteSeat}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={p.panel}>
      <PanelContent
        selectedIds={selectedIds} seats={seats}
        updateSeat={updateSeat} deleteSeat={deleteSeat}
      />
    </div>
  );
}

function PanelContent({ selectedIds, seats, updateSeat, deleteSeat }) {
  if (selectedIds.length > 1) {
    return (
      <>
        <h3 style={p.title}>Selection</h3>
        <div style={p.meta}>{selectedIds.length} seats selected</div>
        <p style={p.hint}>Use Group / Ungroup in the toolbar.</p>
      </>
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
    <>
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
    </>
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
  // ── mobile floating button ───────────────────────────
  fab: {
    position: 'fixed',
    bottom: 20,
    right: 16,
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 18px',
    background: '#2563eb',
    border: '1px solid #3b82f6',
    borderRadius: 24,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(37,99,235,0.5)',
  },
  // ── mobile bottom sheet ──────────────────────────────
  mobileSheet: {
    position: 'fixed',
    left: 0, right: 0, bottom: 0,
    zIndex: 500,
    background: '#1e293b',
    borderTop: '1px solid #475569',
    borderRadius: '14px 14px 0 0',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
  },
  mobileHandle: {
    width: 36, height: 4,
    background: '#475569',
    borderRadius: 2,
    margin: '8px auto 0',
    flexShrink: 0,
  },
  mobileHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 6px',
    flexShrink: 0,
    borderBottom: '1px solid #334155',
  },
  mobileClose: {
    background: 'none', border: 'none',
    color: '#64748b', fontSize: 18,
    cursor: 'pointer', padding: '2px 6px',
    lineHeight: 1,
  },
  mobileBody: {
    overflowY: 'auto',
    padding: '10px 14px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flex: 1,
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
