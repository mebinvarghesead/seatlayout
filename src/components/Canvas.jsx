import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useStore } from '../store/useStore';
import SeatElement from './SeatElement';
import { createSeat } from '../utils/seatFactory';

const GRID = 40;

// Ghost preview of the seat being placed
function GhostSeat({ seat }) {
  const { type, x, y, width, height, r, text, fill, stroke, strokeWidth, fontSize } = seat;
  const props = { opacity: 0.45, pointerEvents: 'none' };

  if (type === 'circle') {
    return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />;
  }
  if (type === 'text') {
    return (
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize} fill={fill} {...props}>
        {text}
      </text>
    );
  }
  return (
    <rect x={x - width / 2} y={y - height / 2} width={width} height={height}
      rx={5} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />
  );
}

export default function Canvas() {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(d3.zoomIdentity);
  const zoomBehaviorRef = useRef(null);

  const mode = useStore(s => s.mode);
  const seats = useStore(s => s.seats);
  const selectedIds = useStore(s => s.selectedIds);
  const placementType = useStore(s => s.placementType);
  const clearSelection  = useStore(s => s.clearSelection);
  const setSelectedIds  = useStore(s => s.setSelectedIds);
  const addSeat         = useStore(s => s.addSeat);

  const [ghostPos, setGhostPos] = useState(null);

  // Convert screen → canvas coordinates
  const toCanvas = useCallback((clientX, clientY) => {
    if (!svgRef.current) return [0, 0];
    const rect = svgRef.current.getBoundingClientRect();
    const t = zoomRef.current;
    return [(clientX - rect.left - t.x) / t.k, (clientY - rect.top - t.y) / t.k];
  }, []);

  // Attach / detach D3 zoom
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom()
      .scaleExtent([0.04, 24])
      .on('zoom', event => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform.toString());
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const { x, y, k } = event.transform;
          useStore.getState().setViewportCenter(
            (rect.width  / 2 - x) / k,
            (rect.height / 2 - y) / k,
          );
        }
      });

    zoomBehaviorRef.current = zoom;

    if (mode === 'free') {
      svg.call(zoom).on('dblclick.zoom', null);
    } else {
      svg.on('.zoom', null);
    }

    return () => svg.on('.zoom', null);
  }, [mode]);

  const handleMouseMove = useCallback(e => {
    if (mode !== 'placement') { setGhostPos(null); return; }
    const [x, y] = toCanvas(e.clientX, e.clientY);
    setGhostPos({ x, y });
  }, [mode, toCanvas]);

  const handleMouseLeave = useCallback(() => setGhostPos(null), []);

  const handleClick = useCallback(e => {
    // Only react to clicks that reach the canvas background
    const onBg = e.target === svgRef.current
      || e.target.classList.contains('canvas-bg')
      || e.target === gRef.current;
    if (!onBg) return;

    if (mode === 'pick') {
      clearSelection();
    } else if (mode === 'placement') {
      const [x, y] = toCanvas(e.clientX, e.clientY);
      const newSeat = createSeat(placementType, x, y);
      addSeat(newSeat);
      setSelectedIds([newSeat.id]);
    }
  }, [mode, placementType, toCanvas, clearSelection, addSeat, setSelectedIds]);

  // Enter key places seat at ghost position in placement mode
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Enter' && mode === 'placement' && ghostPos) {
        const newSeat = createSeat(placementType, ghostPos.x, ghostPos.y);
        addSeat(newSeat);
        setSelectedIds([newSeat.id]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, placementType, ghostPos, addSeat, setSelectedIds]);

  const cursor = mode === 'free' ? 'grab' : mode === 'placement' ? 'crosshair' : 'default';
  const ghost = ghostPos ? createSeat(placementType, ghostPos.x, ghostPos.y) : null;

  return (
    <svg
      ref={svgRef}
      style={{ flex: 1, width: '100%', height: '100%', cursor, display: 'block', background: '#f8fafc' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <defs>
        <pattern id="minor-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
        </pattern>
        <pattern id="major-grid" width={GRID * 5} height={GRID * 5} patternUnits="userSpaceOnUse">
          <rect width={GRID * 5} height={GRID * 5} fill="url(#minor-grid)" />
          <path d={`M ${GRID * 5} 0 L 0 0 0 ${GRID * 5}`} fill="none" stroke="#cbd5e1" strokeWidth="1" />
        </pattern>
      </defs>

      {/* All zoomable/pannable content lives in this <g> */}
      <g ref={gRef}>
        <rect
          className="canvas-bg"
          x="-100000" y="-100000"
          width="200000" height="200000"
          fill="url(#major-grid)"
        />
        {/* Origin cross-hair */}
        <line x1="-20" y1="0" x2="20" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <line x1="0" y1="-20" x2="0" y2="20" stroke="#94a3b8" strokeWidth="1" />

        {seats.map(seat => (
          <SeatElement
            key={seat.id}
            seat={seat}
            isSelected={selectedIds.includes(seat.id)}
            mode={mode}
            toCanvas={toCanvas}
          />
        ))}

        {ghost && mode === 'placement' && <GhostSeat seat={ghost} />}
      </g>
    </svg>
  );
}
