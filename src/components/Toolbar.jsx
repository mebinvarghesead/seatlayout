import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import BulkCreationOverlay from './BulkCreationOverlay';
import TemplateOverlay from './TemplateOverlay';
import LayoutModelsOverlay from './LayoutModelsOverlay';
import CustomModelsOverlay from './CustomModelsOverlay';

// ── Mode buttons ──────────────────────────────────────────────────────────────
const MODES = [
  { id: 'free',      label: 'Free',  key: 'F', icon: HandIcon },
  { id: 'pick',      label: 'Pick',  key: 'P', icon: CursorIcon },
  { id: 'placement', label: 'Place', key: 'A', icon: PlusIcon },
];

// ── Placeable object types ────────────────────────────────────────────────────
const TYPES = [
  { id: 'square', label: 'Square',    icon: SquareIcon },
  { id: 'rect',   label: 'Rectangle', icon: RectIcon },
  { id: 'circle', label: 'Circle',    icon: CircleIcon },
  { id: 'text',   label: 'Text',      icon: TextIcon },
];

// ── overlay state shape: null | { kind:'bulk', seatType } | { kind:'template' }
export default function Toolbar() {
  const mode             = useStore(s => s.mode);
  const setMode          = useStore(s => s.setMode);
  const placementType    = useStore(s => s.placementType);
  const setPlacementType = useStore(s => s.setPlacementType);
  const selectedIds      = useStore(s => s.selectedIds);
  const seats            = useStore(s => s.seats);
  const past             = useStore(s => s.past);
  const future           = useStore(s => s.future);
  const undo             = useStore(s => s.undo);
  const redo             = useStore(s => s.redo);
  const groupSelected    = useStore(s => s.groupSelected);
  const ungroupSelected  = useStore(s => s.ungroupSelected);
  const deleteSelected   = useStore(s => s.deleteSelected);

  const hasSelection = selectedIds.length > 0;
  const canGroup     = selectedIds.length >= 2;
  const canUngroup   = seats.some(s => selectedIds.includes(s.id) && s.groupId);

  const customModels = useStore(s => s.customModels);
  const [overlay, setOverlay] = useState(null);

  function activateType(typeId) {
    setPlacementType(typeId);
    setMode('placement');
  }

  return (
    <div style={s.bar}>
      {/* ── Mode buttons ── */}
      <Section>
        {MODES.map(m => (
          <Btn
            key={m.id}
            active={mode === m.id}
            title={`${m.label} (${m.key})`}
            onClick={() => setMode(m.id)}
          >
            <m.icon />
            <span style={s.btnLabel}>{m.label}</span>
          </Btn>
        ))}
      </Section>

      <Divider />

      {/* ── Object types — split buttons ── */}
      <Section>
        {TYPES.map(t => (
          <SplitBtn
            key={t.id}
            def={t}
            isActive={mode === 'placement' && placementType === t.id}
            dimmed={mode !== 'placement'}
            onMain={() => activateType(t.id)}
            onDropdown={() => setOverlay({ kind: 'bulk', seatType: t.id })}
          />
        ))}
      </Section>

      <Divider />

      {/* ── Templates ── */}
      <Section>
        <Btn title="Place a template arrangement" onClick={() => setOverlay({ kind: 'template' })}>
          <TemplateIcon />
          <span style={s.btnLabel}>Templates</span>
        </Btn>
      </Section>

      <Divider />

      {/* ── Layout Models ── */}
      <Section>
        <Btn title="Place a full venue layout" onClick={() => setOverlay({ kind: 'layouts' })}>
          <LayoutIcon />
          <span style={s.btnLabel}>Layouts</span>
        </Btn>
      </Section>

      <Divider />

      {/* ── Custom Models ── */}
      <Section>
        <Btn title="Your saved custom models" onClick={() => setOverlay({ kind: 'custom' })}>
          <CustomIcon />
          <span style={s.btnLabel}>
            Custom{customModels.length > 0 ? ` (${customModels.length})` : ''}
          </span>
        </Btn>
      </Section>

      <Divider />

      {/* ── Edit actions ── */}
      <Section>
        <Btn disabled={!canGroup}   title="Group (Ctrl+G)" onClick={groupSelected}>
          <GroupIcon /><span style={s.btnLabel}>Group</span>
        </Btn>
        <Btn disabled={!canUngroup} title="Ungroup"        onClick={ungroupSelected}>
          <UngroupIcon /><span style={s.btnLabel}>Ungroup</span>
        </Btn>
        <Btn disabled={!hasSelection} danger title="Delete (Del)" onClick={deleteSelected}>
          <TrashIcon /><span style={s.btnLabel}>Delete</span>
        </Btn>
      </Section>

      <Divider />

      {/* ── Undo / Redo ── */}
      <Section>
        <Btn disabled={!past.length}   title="Undo (Ctrl+Z)" onClick={undo}>
          <UndoIcon /><span style={s.btnLabel}>Undo</span>
        </Btn>
        <Btn disabled={!future.length} title="Redo (Ctrl+Y)" onClick={redo}>
          <RedoIcon /><span style={s.btnLabel}>Redo</span>
        </Btn>
      </Section>

      <div style={s.spacer} />
      <StatusHint mode={mode} placementType={placementType} selectedCount={selectedIds.length} />

      {/* ── Overlays — rendered via portal ── */}
      {overlay?.kind === 'bulk' && (
        <BulkCreationOverlay
          type={overlay.seatType}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay?.kind === 'template' && (
        <TemplateOverlay onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'layouts' && (
        <LayoutModelsOverlay onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'custom' && (
        <CustomModelsOverlay onClose={() => setOverlay(null)} />
      )}
    </div>
  );
}

// ── SplitBtn: left = activate type, right chevron = open bulk overlay ─────────
function SplitBtn({ def, isActive, dimmed, onMain, onDropdown }) {
  const mainStyle = {
    ...s.btn,
    ...(isActive ? s.btnActive : {}),
    ...(dimmed && !isActive ? { opacity: 0.48 } : {}),
    borderRadius: '7px 0 0 7px',
    borderRight: 'none',
    paddingRight: 7,
    minWidth: 46,
  };
  const chevStyle = {
    ...s.btn,
    ...(isActive ? s.btnActive : {}),
    ...(dimmed && !isActive ? { opacity: 0.48 } : {}),
    borderRadius: '0 7px 7px 0',
    padding: '0 6px',
    minWidth: 'unset',
    width: 20,
    color: isActive ? '#93c5fd' : '#64748b',
  };
  return (
    <div style={{ display: 'flex' }}>
      <button style={mainStyle} onClick={onMain} title={`Add ${def.label}`}>
        <def.icon />
        <span style={s.btnLabel}>{def.label}</span>
      </button>
      <button style={chevStyle} onClick={onDropdown} title={`Bulk create ${def.label}s`}>
        <ChevronDownIcon />
      </button>
    </div>
  );
}

// ── primitive sub-components ──────────────────────────────────────────────────
function Section({ children }) { return <div style={s.section}>{children}</div>; }
function Divider()              { return <div style={s.divider} />;               }

function Btn({ children, active, disabled, danger, onClick, title }) {
  const style = {
    ...s.btn,
    ...(active            ? s.btnActive   : {}),
    ...(disabled          ? s.btnDisabled : {}),
    ...(danger && !disabled ? s.btnDanger : {}),
  };
  return (
    <button style={style} onClick={disabled ? undefined : onClick} title={title} disabled={disabled}>
      {children}
    </button>
  );
}

function StatusHint({ mode, placementType, selectedCount }) {
  let msg = '';
  if (mode === 'free')      msg = 'Pan & Zoom — scroll or drag canvas';
  else if (mode === 'pick' && selectedCount > 0) msg = `${selectedCount} selected — drag to move`;
  else if (mode === 'pick') msg = 'Click seats to select  •  ▾ on shape buttons for bulk create';
  else if (mode === 'placement') msg = `Placing ${placementType} — click or Enter  •  ▾ for bulk`;
  return <div style={s.hint}>{msg}</div>;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function HandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-5a2 2 0 1 1 4 0" />
    </svg>
  );
}
function CursorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="m13 13 6 6" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function SquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
function RectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
    </svg>
  );
}
function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
function TextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
function TemplateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 17.5h7M17.5 14v7" />
    </svg>
  );
}
function LayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="3" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="21" />
      <line x1="3" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="21" y2="12" />
    </svg>
  );
}
function CustomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function GroupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" />
    </svg>
  );
}
function UngroupIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="8" height="8" rx="1" strokeDasharray="3 2" />
      <rect x="14" y="14" width="8" height="8" rx="1" strokeDasharray="3 2" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 14 5-5-5-5" /><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
    </svg>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0 12px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    height: 52,
    flexShrink: 0,
    userSelect: 'none',
  },
  section:  { display: 'flex', gap: 3 },
  divider:  { width: 1, height: 28, background: '#334155', margin: '0 6px' },
  spacer:   { flex: 1 },
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: '4px 10px',
    minWidth: 52,
    height: 40,
    background: '#334155',
    color: '#cbd5e1',
    border: '1px solid #475569',
    borderRadius: 7,
    cursor: 'pointer',
    fontSize: 10,
    fontFamily: 'inherit',
    transition: 'background 0.12s, color 0.12s, opacity 0.12s',
  },
  btnActive:   { background: '#2563eb', borderColor: '#3b82f6', color: '#fff' },
  btnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  btnDanger:   { background: '#991b1b', borderColor: '#ef4444', color: '#fca5a5' },
  btnLabel:    { lineHeight: 1 },
  hint:        { color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' },
};
