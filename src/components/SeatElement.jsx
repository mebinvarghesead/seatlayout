import React, { useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';

const SEL_COLOR = '#f97316';
const SEL_DASH  = '5 3';

export default function SeatElement({ seat, isSelected, mode, toCanvas }) {
  const {
    id, type, x, y, width, height, r,
    text, fill, stroke, strokeWidth,
    label, labelFontSize, labelColor, labelFontWeight,
    fontSize, fontFamily, fontWeight,
    rotation, groupId,
  } = seat;

  // ── inline editing state ──────────────────────────────────────────────────
  const [editingText,  setEditingText]  = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [draft,        setDraft]        = useState('');

  const toggleSelection = useStore(s => s.toggleSelection);
  const batchUpdateSeats = useStore(s => s.batchUpdateSeats);
  const pushSnapshot    = useStore(s => s.pushSnapshot);
  const updateSeat      = useStore(s => s.updateSeat);
  const dragRef         = useRef(null);

  // ── drag ─────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (mode === 'free') return;
    e.stopPropagation();

    const store = useStore.getState();
    const currentSelected = store.selectedIds;
    const alreadySelected = currentSelected.includes(id);

    if (e.shiftKey) {
      toggleSelection(id, true);
    } else if (!alreadySelected) {
      toggleSelection(id, false);
    }

    const preDrag = {
      seats:  store.seats.map(s => ({ ...s })),
      groups: store.groups.map(g => ({ ...g, seatIds: [...g.seatIds] })),
    };

    const [startX, startY] = toCanvas(e.clientX, e.clientY);

    const sel = alreadySelected && !e.shiftKey ? currentSelected : [id];
    const movingIds = new Set(sel);

    if (groupId) {
      const group = store.groups.find(g => g.id === groupId);
      if (group) group.seatIds.forEach(sid => movingIds.add(sid));
    }
    sel.forEach(sid => {
      const s = store.seats.find(st => st.id === sid);
      if (s?.groupId) {
        const g = store.groups.find(gr => gr.id === s.groupId);
        if (g) g.seatIds.forEach(gsid => movingIds.add(gsid));
      }
    });

    const startPositions = store.seats
      .filter(s => movingIds.has(s.id))
      .map(s => ({ id: s.id, x: s.x, y: s.y }));

    dragRef.current = { startX, startY, startPositions, moved: false, preDrag };

    const onMouseMove = (me) => {
      if (!dragRef.current) return;
      const [cx, cy] = toCanvas(me.clientX, me.clientY);
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragRef.current.moved = true;
      if (dragRef.current.moved) {
        batchUpdateSeats(
          dragRef.current.startPositions.map(({ id: sid, x: sx, y: sy }) => ({
            id: sid, x: sx + dx, y: sy + dy,
          }))
        );
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (dragRef.current?.moved) pushSnapshot(dragRef.current.preDrag);
      dragRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [mode, id, groupId, toCanvas, toggleSelection, batchUpdateSeats, pushSnapshot]);

  // ── double-click to edit ──────────────────────────────────────────────────
  const handleDoubleClick = useCallback((e) => {
    if (mode === 'free') return;
    e.stopPropagation();
    if (type === 'text') {
      setDraft(text || '');
      setEditingText(true);
    } else {
      setDraft(label || '');
      setEditingLabel(true);
    }
  }, [type, mode, text, label]);

  const commitText = useCallback(() => {
    setEditingText(false);
    updateSeat(id, { text: draft });
  }, [id, draft, updateSeat]);

  const commitLabel = useCallback(() => {
    setEditingLabel(false);
    updateSeat(id, { label: draft });
  }, [id, draft, updateSeat]);

  const stopKey = (commit, cancel) => (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  const noPtr = { pointerEvents: 'none' };
  const transform = rotation ? `rotate(${rotation},${x},${y})` : undefined;
  const notFree   = mode !== 'free';

  // ── circle ────────────────────────────────────────────────────────────────
  if (type === 'circle') {
    const lSize = labelFontSize || 13;
    return (
      <g transform={transform}>
        {isSelected && (
          <circle cx={x} cy={y} r={r + 6} fill="none"
            stroke={SEL_COLOR} strokeWidth={1.5} strokeDasharray={SEL_DASH}
            style={noPtr} />
        )}
        <circle
          cx={x} cy={y} r={r}
          fill={fill} stroke={stroke} strokeWidth={strokeWidth}
          style={{ cursor: notFree ? 'pointer' : 'default' }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onClick={e => e.stopPropagation()}
        />
        {editingLabel ? (
          <foreignObject x={x - r + 4} y={y - lSize * 0.9} width={(r - 4) * 2} height={lSize * 1.8}>
            <input
              style={inlineInputStyle(labelColor || '#fff', lSize, labelFontWeight || 'normal', 'center')}
              value={draft} autoFocus
              onChange={e => setDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={stopKey(commitLabel, () => setEditingLabel(false))}
              onClick={e => e.stopPropagation()}
            />
          </foreignObject>
        ) : (
          label && (
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
              fontSize={lSize} fill={labelColor || '#fff'}
              fontWeight={labelFontWeight || 'normal'}
              style={{ ...noPtr, cursor: notFree ? 'pointer' : 'default' }}>
              {label}
            </text>
          )
        )}
      </g>
    );
  }

  // ── text ──────────────────────────────────────────────────────────────────
  if (type === 'text') {
    const ff   = fontFamily || 'sans-serif';
    const fw   = fontWeight || 'normal';
    const fs   = fontSize   || 18;
    const estW = Math.max(60, (text?.length || 4) * fs * 0.55);
    const estH = fs * 1.4;
    const showBg = isSelected || editingText;

    return (
      <g transform={transform}>
        {/* Background box — only visible when focused / selected */}
        {showBg && (
          <rect
            x={x - estW / 2 - 6} y={y - estH / 2 - 4}
            width={estW + 12} height={estH + 8}
            rx={4}
            fill={editingText ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)'}
            stroke={SEL_COLOR} strokeWidth={1.5}
            strokeDasharray={editingText ? 'none' : SEL_DASH}
            style={noPtr}
          />
        )}
        {editingText ? (
          <foreignObject
            x={x - estW / 2 - 6} y={y - estH / 2 - 4}
            width={estW + 16} height={estH + 10}>
            <input
              style={inlineInputStyle(fill, fs, fw, 'center', ff)}
              value={draft} autoFocus
              onChange={e => setDraft(e.target.value)}
              onBlur={commitText}
              onKeyDown={stopKey(commitText, () => setEditingText(false))}
              onClick={e => e.stopPropagation()}
            />
          </foreignObject>
        ) : (
          <text
            x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={fs} fill={fill}
            fontFamily={ff} fontWeight={fw}
            style={{ cursor: notFree ? 'pointer' : 'default', userSelect: 'none' }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            onClick={e => e.stopPropagation()}
          >
            {text}
          </text>
        )}
      </g>
    );
  }

  // ── square / rect ─────────────────────────────────────────────────────────
  const rx   = x - width  / 2;
  const ry   = y - height / 2;
  const lSize = labelFontSize || 13;
  return (
    <g transform={transform}>
      {isSelected && (
        <rect x={rx - 5} y={ry - 5} width={width + 10} height={height + 10}
          rx={7} fill="rgba(249,115,22,0.08)"
          stroke={SEL_COLOR} strokeWidth={1.5} strokeDasharray={SEL_DASH}
          style={noPtr} />
      )}
      <rect
        x={rx} y={ry} width={width} height={height} rx={5}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        style={{ cursor: notFree ? 'pointer' : 'default' }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onClick={e => e.stopPropagation()}
      />
      {editingLabel ? (
        <foreignObject x={rx + 4} y={y - lSize * 0.9} width={width - 8} height={lSize * 1.8}>
          <input
            style={inlineInputStyle(labelColor || '#fff', lSize, labelFontWeight || 'normal', 'center')}
            value={draft} autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={stopKey(commitLabel, () => setEditingLabel(false))}
            onClick={e => e.stopPropagation()}
          />
        </foreignObject>
      ) : (
        label && (
          <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
            fontSize={lSize} fill={labelColor || '#fff'}
            fontWeight={labelFontWeight || 'normal'}
            style={{ ...noPtr, cursor: notFree ? 'pointer' : 'default' }}>
            {label}
          </text>
        )
      )}
    </g>
  );
}

// ── shared inline editor style ────────────────────────────────────────────────
function inlineInputStyle(color, fontSize, fontWeight, textAlign, fontFamily = 'inherit') {
  return {
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.35)',
    border: 'none',
    outline: `2px solid ${SEL_COLOR}`,
    borderRadius: 3,
    color,
    fontSize,
    fontWeight,
    fontFamily,
    textAlign,
    padding: '1px 4px',
  };
}
