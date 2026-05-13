import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { TEMPLATES, getTemplateBBox } from '../data/templates';

// ── SVG preview of a template ─────────────────────────────────────────────────
function TemplatePreview({ seats }) {
  const W = 300, H = 210, PAD = 16;
  if (!seats.length) {
    return <svg width={W} height={H}><text x={W/2} y={H/2} textAnchor="middle" fill="#475569" fontSize={13}>No preview</text></svg>;
  }

  const bb = getTemplateBBox(seats);
  const scaleX = (W - PAD * 2) / (bb.w || 1);
  const scaleY = (H - PAD * 2) / (bb.h || 1);
  const scale  = Math.min(scaleX, scaleY, 1.5);
  const ox = W / 2 - ((bb.minX + bb.maxX) / 2) * scale;
  const oy = H / 2 - ((bb.minY + bb.maxY) / 2) * scale;

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <g transform={`translate(${ox},${oy}) scale(${scale})`}>
        {seats.map(s => {
          if (s.type === 'circle') {
            return (
              <g key={s.id}>
                <circle cx={s.x} cy={s.y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={1.5 / scale} />
                {s.label && <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
                  fontSize={s.labelFontSize || 12} fill={s.labelColor || '#fff'}>{s.label}</text>}
              </g>
            );
          }
          const hw = (s.width || 60) / 2, hh = (s.height || 40) / 2;
          const tf = s.rotation ? `rotate(${s.rotation},${s.x},${s.y})` : undefined;
          return (
            <g key={s.id} transform={tf}>
              <rect x={s.x - hw} y={s.y - hh} width={s.width || 60} height={s.height || 40}
                rx={3} fill={s.fill} stroke={s.stroke} strokeWidth={1.5 / scale} />
              {s.label && <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
                fontSize={s.labelFontSize || 11} fill={s.labelColor || '#fff'}>{s.label}</text>}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function TemplateOverlay({ onClose }) {
  const addBulkSeats = useStore(s => s.addBulkSeats);
  const [selected, setSelected] = useState(TEMPLATES[0]);
  const [params,   setParams]   = useState(() => defaultParams(TEMPLATES[0]));

  function selectTemplate(tmpl) {
    setSelected(tmpl);
    setParams(defaultParams(tmpl));
  }

  function setParam(key, value) {
    setParams(p => ({ ...p, [key]: value }));
  }

  const preview = useMemo(() => {
    try { return selected.build(params, 0, 0); }
    catch { return []; }
  }, [selected, params]);

  function handlePlace() {
    const seats = selected.build(params, 0, 0);
    addBulkSeats(seats, true);  // group = true → all seats move as one unit
    onClose();
  }

  return createPortal(
    <div style={t.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={t.panel}>
        {/* Header */}
        <div style={t.header}>
          <span style={t.title}>Place Template</span>
          <button style={t.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Template tabs */}
        <div style={t.tabs}>
          {TEMPLATES.map(tmpl => (
            <button
              key={tmpl.id}
              style={{ ...t.tab, ...(selected.id === tmpl.id ? t.tabActive : {}) }}
              onClick={() => selectTemplate(tmpl)}
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        <div style={t.body}>
          {/* ── Param form ── */}
          <div style={t.formCol}>
            <p style={t.desc}>{selected.description}</p>

            <div style={t.fieldList}>
              {selected.paramDefs.map(def => (
                <div key={def.key} style={t.field}>
                  <span style={t.fieldLabel}>{def.label}</span>
                  {def.type === 'color' ? (
                    <input
                      type="color" style={t.colorIn}
                      value={params[def.key] ?? def.default}
                      onChange={e => setParam(def.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="number" style={t.input}
                      value={params[def.key] ?? def.default}
                      min={def.min} max={def.max}
                      onChange={e => {
                        const n = parseFloat(e.target.value);
                        if (!isNaN(n)) setParam(def.key, Math.min(def.max, Math.max(def.min, n)));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Preview ── */}
          <div style={t.previewCol}>
            <div style={t.previewTitle}>Preview — {preview.length} objects</div>
            <div style={t.previewBox}>
              <TemplatePreview seats={preview} />
            </div>
            <p style={t.previewNote}>
              Placed as a group — moves and rotates as one unit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={t.footer}>
          <button style={t.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={t.placeBtn} onClick={handlePlace}>Place Template</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function defaultParams(tmpl) {
  return Object.fromEntries(tmpl.paramDefs.map(d => [d.key, d.default]));
}

// ── styles ────────────────────────────────────────────────────────────────────
const t = {
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
    width: 720, maxWidth: '96vw', maxHeight: '94vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', borderBottom: '1px solid #334155',
  },
  title:    { color: '#f1f5f9', fontSize: 15, fontWeight: 700 },
  closeBtn: {
    background: 'none', border: 'none', color: '#64748b',
    fontSize: 16, cursor: 'pointer', padding: '2px 6px',
    borderRadius: 5, fontFamily: 'inherit',
  },
  tabs: {
    display: 'flex', gap: 2, padding: '8px 18px',
    borderBottom: '1px solid #334155', background: '#0f172a',
  },
  tab: {
    padding: '6px 14px', background: 'none',
    border: '1px solid transparent', borderRadius: 6,
    color: '#64748b', cursor: 'pointer', fontSize: 12,
    fontFamily: 'inherit', fontWeight: 500,
  },
  tabActive: {
    background: '#1e293b', border: '1px solid #334155',
    color: '#e2e8f0', fontWeight: 700,
  },
  body: {
    display: 'flex', gap: 0, flex: 1, overflowY: 'auto',
  },
  formCol: {
    width: 260, flexShrink: 0,
    borderRight: '1px solid #334155',
    padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: 10,
    overflowY: 'auto',
  },
  desc: { color: '#64748b', fontSize: 12, lineHeight: 1.5, margin: 0 },
  fieldList: { display: 'flex', flexDirection: 'column', gap: 9 },
  field:      { display: 'flex', alignItems: 'center', gap: 8 },
  fieldLabel: { color: '#94a3b8', fontSize: 12, width: 110, flexShrink: 0 },
  input: {
    flex: 1, background: '#0f172a', border: '1px solid #334155',
    borderRadius: 5, color: '#e2e8f0', padding: '5px 8px',
    fontSize: 13, fontFamily: 'inherit', outline: 'none',
  },
  colorIn: {
    flex: 1, height: 32, padding: 2,
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 5, cursor: 'pointer',
  },
  previewCol: {
    flex: 1, padding: '16px 18px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  previewTitle: {
    color: '#475569', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  previewBox: {
    flex: 1, background: '#0f172a',
    borderRadius: 8, border: '1px solid #1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', minHeight: 210,
  },
  previewNote: {
    color: '#475569', fontSize: 11, margin: 0,
    textAlign: 'center',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '12px 18px', borderTop: '1px solid #334155',
  },
  cancelBtn: {
    padding: '8px 20px', background: '#334155', color: '#cbd5e1',
    border: '1px solid #475569', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  placeBtn: {
    padding: '8px 22px', background: '#7c3aed', color: '#fff',
    border: '1px solid #8b5cf6', borderRadius: 7,
    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
};
