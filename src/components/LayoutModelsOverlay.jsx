import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LAYOUT_MODELS, getLayoutBBox } from '../data/layoutModels';
import { useStore } from '../store/useStore';

function defaultParams(model) {
  return Object.fromEntries(model.paramDefs.map(d => [d.key, d.default]));
}

// ── preview SVG renderer ──────────────────────────────────────────────────────
function PreviewSVG({ seats, width = 420, height = 360 }) {
  const PREVIEW_LIMIT = 600;
  const preview = seats.length > PREVIEW_LIMIT ? seats.slice(0, PREVIEW_LIMIT) : seats;
  const bbox = getLayoutBBox(preview);
  const pad = 24;
  const scaleX = (width  - pad * 2) / Math.max(bbox.w, 1);
  const scaleY = (height - pad * 2) / Math.max(bbox.h, 1);
  const scale  = Math.min(scaleX, scaleY, 1.6);
  const tx = width  / 2 - ((bbox.minX + bbox.maxX) / 2) * scale;
  const ty = height / 2 - ((bbox.minY + bbox.maxY) / 2) * scale;

  return (
    <svg width={width} height={height} style={{ display: 'block', background: '#0f172a', borderRadius: 8 }}>
      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        {preview.map(s => <PreviewSeat key={s.id} seat={s} />)}
      </g>
      {seats.length > PREVIEW_LIMIT && (
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#64748b">
          Preview limited — full layout placed on canvas
        </text>
      )}
    </svg>
  );
}

function PreviewSeat({ seat: s }) {
  if (s.type === 'circle') {
    return (
      <g>
        <circle cx={s.x} cy={s.y} r={s.r} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
        {s.label && (
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
            fontSize={s.labelFontSize} fill={s.labelColor} fontWeight={s.labelFontWeight}>
            {s.label}
          </text>
        )}
      </g>
    );
  }
  if (s.type === 'rect') {
    const rot = s.rotation || 0;
    return (
      <g transform={rot ? `rotate(${rot},${s.x},${s.y})` : undefined}>
        <rect x={s.x - s.width / 2} y={s.y - s.height / 2}
          width={s.width} height={s.height}
          fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} rx={2} />
        {s.label && (
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
            fontSize={s.labelFontSize} fill={s.labelColor} fontWeight={s.labelFontWeight}>
            {s.label}
          </text>
        )}
      </g>
    );
  }
  if (s.type === 'text') {
    return (
      <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
        fontSize={s.fontSize} fill={s.fill} fontFamily={s.fontFamily} fontWeight={s.fontWeight}>
        {s.text}
      </text>
    );
  }
  return null;
}

// ── param form ────────────────────────────────────────────────────────────────
function ParamForm({ model, params, onChange }) {
  return (
    <div style={fs.form}>
      {model.paramDefs.map(def => (
        <label key={def.key} style={fs.row}>
          <span style={fs.label}>{def.label}</span>
          {def.type === 'number' ? (
            <div style={fs.numGroup}>
              <input
                type="range"
                min={def.min} max={def.max} step={1}
                value={params[def.key]}
                onChange={e => onChange(def.key, Number(e.target.value))}
                style={fs.slider}
              />
              <input
                type="number"
                min={def.min} max={def.max}
                value={params[def.key]}
                onChange={e => onChange(def.key, Math.min(def.max, Math.max(def.min, Number(e.target.value))))}
                style={fs.numInput}
              />
            </div>
          ) : (
            <input
              type="color"
              value={params[def.key]}
              onChange={e => onChange(def.key, e.target.value)}
              style={fs.colorInput}
            />
          )}
        </label>
      ))}
    </div>
  );
}

// ── main overlay ──────────────────────────────────────────────────────────────
export default function LayoutModelsOverlay({ onClose }) {
  const addBulkSeats = useStore(s => s.addBulkSeats);
  const [activeId, setActiveId]   = useState(LAYOUT_MODELS[0].id);
  const [params,   setParams]     = useState(() => defaultParams(LAYOUT_MODELS[0]));

  const model = LAYOUT_MODELS.find(m => m.id === activeId);

  function selectModel(m) {
    setActiveId(m.id);
    setParams(defaultParams(m));
  }

  function setParam(key, val) {
    setParams(p => ({ ...p, [key]: val }));
  }

  const previewSeats = useMemo(() => {
    try { return model.build(params); } catch (_e) { return []; }
  }, [model, params]);

  function handlePlace() {
    try {
      const seats = model.build(params);
      addBulkSeats(seats, true);
      onClose();
    } catch (_e) { /* build error — do nothing */ }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div style={os.backdrop} onMouseDown={handleBackdrop}>
      <div style={os.modal} onMouseDown={e => e.stopPropagation()}>
        {/* Header */}
        <div style={os.header}>
          <span style={os.title}>Layout Models</span>
          <button style={os.close} onClick={onClose}>✕</button>
        </div>

        <div style={os.body}>
          {/* Left: model list */}
          <div style={os.sidebar}>
            {LAYOUT_MODELS.map(m => (
              <button
                key={m.id}
                style={{ ...os.card, ...(m.id === activeId ? os.cardActive : {}) }}
                onClick={() => selectModel(m)}
              >
                <span style={os.cardIcon}>{m.icon}</span>
                <div style={os.cardText}>
                  <div style={os.cardName}>{m.name}</div>
                  <div style={os.cardDesc}>{m.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: params + preview */}
          <div style={os.right}>
            <div style={os.rightTop}>
              {/* Params */}
              <div style={os.paramsCol}>
                <div style={os.sectionTitle}>{model.icon} {model.name}</div>
                <ParamForm model={model} params={params} onChange={setParam} />
              </div>
              {/* Preview */}
              <div style={os.previewCol}>
                <div style={os.sectionTitle}>Preview</div>
                <PreviewSVG seats={previewSeats} width={380} height={320} />
                <div style={os.previewMeta}>
                  {previewSeats.length} elements &nbsp;·&nbsp; placed as single grouped object
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={os.footer}>
              <button style={os.btnCancel} onClick={onClose}>Cancel</button>
              <button style={os.btnPlace} onClick={handlePlace}>
                Place Layout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const os = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    width: 860,
    maxWidth: '96vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid #334155',
    flexShrink: 0,
  },
  title: { color: '#f1f5f9', fontWeight: 700, fontSize: 16 },
  close: {
    background: 'none', border: 'none', color: '#64748b',
    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: 200,
    flexShrink: 0,
    borderRight: '1px solid #334155',
    overflowY: 'auto',
    padding: '8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  card: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, padding: '10px 10px',
    cursor: 'pointer', textAlign: 'left', width: '100%',
    color: '#cbd5e1',
    transition: 'background 0.12s, border-color 0.12s',
  },
  cardActive: { background: '#1d3a6b', borderColor: '#3b82f6' },
  cardIcon: { fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  cardText: { flex: 1, minWidth: 0 },
  cardName: { color: '#f1f5f9', fontSize: 13, fontWeight: 600, marginBottom: 2 },
  cardDesc: { color: '#64748b', fontSize: 11, lineHeight: 1.35 },

  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0,
  },
  rightTop: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  paramsCol: {
    width: 240,
    flexShrink: 0,
    borderRight: '1px solid #334155',
    overflowY: 'auto',
    padding: '14px 14px',
  },
  previewCol: {
    flex: 1,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-start',
    overflow: 'auto',
  },
  sectionTitle: {
    color: '#94a3b8', fontSize: 12, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 10,
  },
  previewMeta: { color: '#475569', fontSize: 11 },
  footer: {
    borderTop: '1px solid #334155',
    padding: '12px 20px',
    display: 'flex', gap: 10, justifyContent: 'flex-end',
    flexShrink: 0,
  },
  btnCancel: {
    padding: '8px 20px', background: '#334155',
    border: '1px solid #475569', borderRadius: 7,
    color: '#cbd5e1', cursor: 'pointer', fontSize: 13,
  },
  btnPlace: {
    padding: '8px 24px',
    background: '#2563eb', border: '1px solid #3b82f6',
    borderRadius: 7, color: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
};

const fs = {
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: {
    display: 'flex', flexDirection: 'column', gap: 4,
    fontSize: 12,
  },
  label: { color: '#94a3b8', fontSize: 11 },
  numGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  slider: { flex: 1, accentColor: '#3b82f6', cursor: 'pointer' },
  numInput: {
    width: 46, background: '#0f172a', border: '1px solid #475569',
    borderRadius: 5, color: '#e2e8f0', padding: '2px 5px',
    fontSize: 12, textAlign: 'right',
    fontFamily: 'inherit',
  },
  colorInput: {
    width: 36, height: 26, border: '1px solid #475569',
    borderRadius: 5, cursor: 'pointer', background: 'none',
    padding: 2,
  },
};
