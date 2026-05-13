// Layout Model definitions — large-scale venue layouts
// Each model: { id, name, description, icon, paramDefs[], build(params) → seat[] }
// build() returns seats centered around (0,0); addBulkSeats offsets to viewportCenter.

let _lc = 0;
function uid() { return `lm-${Date.now()}-${_lc++}`; }

function cSeat(x, y, r, fill, label = '', sw = 1.5) {
  return {
    id: uid(), type: 'circle',
    x, y, r,
    fill, stroke: darken(fill), strokeWidth: sw,
    label, labelFontSize: Math.max(7, Math.round(r * 0.55)),
    labelColor: '#ffffff', labelFontWeight: 'normal',
    rotation: 0, groupId: null,
  };
}

function rElem(x, y, w, h, fill, opts = {}) {
  return {
    id: uid(), type: 'rect',
    x, y, width: w, height: h,
    fill, stroke: opts.stroke ?? darken(fill), strokeWidth: opts.sw ?? 1.5,
    label: opts.label ?? '', labelFontSize: opts.lfs ?? 12,
    labelColor: opts.lc ?? '#ffffff', labelFontWeight: opts.lfw ?? 'normal',
    rotation: opts.rot ?? 0, groupId: null,
  };
}

function tLabel(x, y, text, fontSize = 13, fill = '#ffffff') {
  return {
    id: uid(), type: 'text',
    x, y, text,
    fontSize, fill, stroke: 'none', strokeWidth: 0,
    fontFamily: 'sans-serif', fontWeight: 'bold',
    rotation: 0, groupId: null,
  };
}

function darken(hex) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) - 40);
    const g = Math.max(0, ((n >> 8)  & 255) - 40);
    const b = Math.max(0, ((n)       & 255) - 40);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  } catch (_e) { return '#334155'; }
}

// ── place seats evenly on a circular arc ─────────────────────────────────────
function arcSeats(cx, cy, radius, startAngle, endAngle, count, r, fill) {
  const seats = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const a = startAngle + t * (endAngle - startAngle);
    seats.push(cSeat(cx + radius * Math.cos(a), cy + radius * Math.sin(a), r, fill));
  }
  return seats;
}

export const LAYOUT_MODELS = [

  // ── 1. Cricket Stadium ─────────────────────────────────────────────────────
  {
    id: 'cricket-stadium',
    name: 'Cricket Stadium',
    description: 'Circular field with concentric seating stands',
    icon: '🏏',
    paramDefs: [
      { key: 'fieldRadius',    label: 'Field radius',      type: 'number', min: 80,  max: 300, default: 160 },
      { key: 'standRows',      label: 'Stand rows',        type: 'number', min: 1,   max: 6,   default: 3 },
      { key: 'seatsPerRow',    label: 'Seats per row',     type: 'number', min: 8,   max: 40,  default: 20 },
      { key: 'seatRadius',     label: 'Seat radius',       type: 'number', min: 5,   max: 18,  default: 9 },
      { key: 'rowSpacing',     label: 'Row spacing',       type: 'number', min: 10,  max: 40,  default: 22 },
      { key: 'fieldColor',     label: 'Field color',       type: 'color',  default: '#22c55e' },
      { key: 'pitchColor',     label: 'Pitch color',       type: 'color',  default: '#d4a574' },
      { key: 'northColor',     label: 'North stand color', type: 'color',  default: '#3b82f6' },
      { key: 'southColor',     label: 'South stand color', type: 'color',  default: '#ef4444' },
      { key: 'eastColor',      label: 'East stand color',  type: 'color',  default: '#f59e0b' },
      { key: 'westColor',      label: 'West stand color',  type: 'color',  default: '#8b5cf6' },
    ],
    build(p) {
      const seats = [];
      // Field
      seats.push(cSeat(0, 0, p.fieldRadius, p.fieldColor, '', 2));
      // Pitch (center rectangle)
      seats.push(rElem(-10, -50, 20, 100, p.pitchColor, { sw: 1.5, label: 'Pitch', lfs: 10, lc: '#92400e' }));

      const quadrants = [
        { label: 'N', a0: -Math.PI * 0.75, a1: -Math.PI * 0.25, color: p.northColor },
        { label: 'S', a0:  Math.PI * 0.25, a1:  Math.PI * 0.75, color: p.southColor },
        { label: 'E', a0: -Math.PI * 0.25, a1:  Math.PI * 0.25, color: p.eastColor  },
        { label: 'W', a0:  Math.PI * 0.75, a1:  Math.PI * 1.25, color: p.westColor  },
      ];

      quadrants.forEach(q => {
        for (let row = 0; row < p.standRows; row++) {
          const orbitR = p.fieldRadius + p.seatRadius + 6 + row * (p.seatRadius * 2 + p.rowSpacing - p.seatRadius);
          arcSeats(0, 0, orbitR, q.a0, q.a1, p.seatsPerRow, p.seatRadius, q.color)
            .forEach(s => seats.push(s));
        }
        // Stand label
        const labelR = p.fieldRadius + p.seatRadius + 6 + p.standRows * (p.seatRadius * 2 + p.rowSpacing - p.seatRadius) + 18;
        const midA = (q.a0 + q.a1) / 2;
        seats.push(tLabel(labelR * Math.cos(midA), labelR * Math.sin(midA), q.label + ' Stand', 13));
      });

      return seats;
    },
  },

  // ── 2. Football Stadium ────────────────────────────────────────────────────
  {
    id: 'football-stadium',
    name: 'Football Stadium',
    description: 'Rectangular pitch with stands on all four sides',
    icon: '⚽',
    paramDefs: [
      { key: 'pitchW',      label: 'Pitch width',       type: 'number', min: 120, max: 500, default: 320 },
      { key: 'pitchH',      label: 'Pitch height',      type: 'number', min: 80,  max: 340, default: 210 },
      { key: 'standRows',   label: 'Stand rows',        type: 'number', min: 1,   max: 8,   default: 4 },
      { key: 'sideSeats',   label: 'Side seats / row',  type: 'number', min: 4,   max: 30,  default: 16 },
      { key: 'endSeats',    label: 'End seats / row',   type: 'number', min: 4,   max: 20,  default: 10 },
      { key: 'seatW',       label: 'Seat width',        type: 'number', min: 10,  max: 30,  default: 16 },
      { key: 'seatH',       label: 'Seat height',       type: 'number', min: 8,   max: 24,  default: 13 },
      { key: 'rowGap',      label: 'Row gap',           type: 'number', min: 2,   max: 20,  default: 6  },
      { key: 'standGap',    label: 'Gap to pitch',      type: 'number', min: 8,   max: 40,  default: 18 },
      { key: 'pitchColor',  label: 'Pitch color',       type: 'color',  default: '#16a34a' },
      { key: 'northColor',  label: 'N/S stand color',   type: 'color',  default: '#ef4444' },
      { key: 'eastColor',   label: 'E/W stand color',   type: 'color',  default: '#3b82f6' },
    ],
    build(p) {
      const seats = [];
      const hw = p.pitchW / 2, hh = p.pitchH / 2;

      // Pitch
      seats.push(rElem(0, 0, p.pitchW, p.pitchH, p.pitchColor, { sw: 2, label: 'Pitch', lfs: 16, lfw: 'bold' }));
      // Center line
      seats.push(rElem(0, 0, 2, p.pitchH, '#ffffff', { sw: 0, label: '' }));
      // Center circle (fake with a circle)
      seats.push(cSeat(0, 0, 36, 'none', '', 0));

      const rowStep = p.seatH + p.rowGap;

      // North & South stands
      for (let side of [-1, 1]) {
        const color = p.northColor;
        const baseY = side * (hh + p.standGap);
        for (let row = 0; row < p.standRows; row++) {
          const y = baseY + side * (row * rowStep + p.seatH / 2);
          const totalW = p.sideSeats * (p.seatW + 2) - 2;
          for (let col = 0; col < p.sideSeats; col++) {
            const x = -totalW / 2 + col * (p.seatW + 2) + p.seatW / 2;
            seats.push(rElem(x, y, p.seatW, p.seatH, color, { sw: 0.8 }));
          }
        }
        const labelY = baseY + side * (p.standRows * rowStep + 14);
        seats.push(tLabel(0, labelY, side < 0 ? 'North Stand' : 'South Stand', 13));
      }

      // East & West stands
      for (let side of [-1, 1]) {
        const color = p.eastColor;
        const baseX = side * (hw + p.standGap);
        for (let row = 0; row < p.standRows; row++) {
          const x = baseX + side * (row * rowStep + p.seatH / 2);
          const totalH = p.endSeats * (p.seatW + 2) - 2;
          for (let col = 0; col < p.endSeats; col++) {
            const y = -totalH / 2 + col * (p.seatW + 2) + p.seatW / 2;
            seats.push(rElem(x, y, p.seatH, p.seatW, color, { sw: 0.8 }));
          }
        }
        const labelX = baseX + side * (p.standRows * rowStep + 14);
        seats.push(tLabel(labelX, 0, side < 0 ? 'West Stand' : 'East Stand', 13));
      }

      return seats;
    },
  },

  // ── 3. Conference Hall ─────────────────────────────────────────────────────
  {
    id: 'conference-hall',
    name: 'Conference Hall',
    description: 'Stage, podium, round tables with chairs',
    icon: '🎤',
    paramDefs: [
      { key: 'tables',       label: 'Round tables',      type: 'number', min: 1, max: 16, default: 6  },
      { key: 'chairsPerTable',label: 'Chairs / table',   type: 'number', min: 3, max: 12, default: 6  },
      { key: 'tableRadius',  label: 'Table radius',      type: 'number', min: 24, max: 80, default: 40 },
      { key: 'chairRadius',  label: 'Chair radius',      type: 'number', min: 8,  max: 24, default: 13 },
      { key: 'cols',         label: 'Tables per row',    type: 'number', min: 1,  max: 6,  default: 3  },
      { key: 'colGap',       label: 'Column gap',        type: 'number', min: 10, max: 80, default: 30 },
      { key: 'rowGap',       label: 'Row gap',           type: 'number', min: 10, max: 80, default: 30 },
      { key: 'stageColor',   label: 'Stage color',       type: 'color',  default: '#475569' },
      { key: 'tableColor',   label: 'Table color',       type: 'color',  default: '#78716c' },
      { key: 'chairColor',   label: 'Chair color',       type: 'color',  default: '#3b82f6' },
    ],
    build(p) {
      const seats = [];
      const rows = Math.ceil(p.tables / p.cols);
      const cellW = p.tableRadius * 2 + p.chairRadius * 2 + p.colGap;
      const cellH = p.tableRadius * 2 + p.chairRadius * 2 + p.rowGap;
      const totalW = p.cols * cellW;
      const totalH = rows * cellH;

      // Stage
      const stageW = Math.max(totalW * 0.6, 200), stageH = 50;
      seats.push(rElem(0, -(totalH / 2) - stageH - 20, stageW, stageH, p.stageColor,
        { label: 'Stage', lfs: 16, lfw: 'bold', lc: '#e2e8f0', sw: 2 }));
      // Podium
      seats.push(rElem(0, -(totalH / 2) - stageH / 2 - 20, 34, 26, '#1e293b',
        { label: 'Podium', lfs: 9, lc: '#94a3b8', sw: 1 }));

      for (let i = 0; i < p.tables; i++) {
        const col = i % p.cols;
        const row = Math.floor(i / p.cols);
        const cx = -totalW / 2 + col * cellW + cellW / 2;
        const cy = -totalH / 2 + row * cellH + cellH / 2;

        seats.push(cSeat(cx, cy, p.tableRadius, p.tableColor, `T${i + 1}`, 2));
        const orbit = p.tableRadius + p.chairRadius + 6;
        for (let c = 0; c < p.chairsPerTable; c++) {
          const a = (2 * Math.PI * c) / p.chairsPerTable - Math.PI / 2;
          seats.push(cSeat(cx + orbit * Math.cos(a), cy + orbit * Math.sin(a), p.chairRadius, p.chairColor));
        }
      }
      return seats;
    },
  },

  // ── 4. Cinema Theater ─────────────────────────────────────────────────────
  {
    id: 'cinema-theater',
    name: 'Cinema Theater',
    description: 'Curved rows of seats facing a screen',
    icon: '🎬',
    paramDefs: [
      { key: 'rows',        label: 'Rows',            type: 'number', min: 2, max: 16, default: 8   },
      { key: 'seatsPerRow', label: 'Seats per row',   type: 'number', min: 4, max: 30, default: 14  },
      { key: 'seatW',       label: 'Seat width',      type: 'number', min: 14, max: 50, default: 26 },
      { key: 'seatH',       label: 'Seat height',     type: 'number', min: 12, max: 40, default: 22 },
      { key: 'arcRadius',   label: 'Arc radius',      type: 'number', min: 100, max: 800, default: 380 },
      { key: 'rowSpacing',  label: 'Row spacing',     type: 'number', min: 10, max: 60, default: 36 },
      { key: 'aisleCol',    label: 'Aisle after col', type: 'number', min: 0, max: 20, default: 7   },
      { key: 'screenColor', label: 'Screen color',    type: 'color',  default: '#e2e8f0' },
      { key: 'seatColor',   label: 'Seat color',      type: 'color',  default: '#dc2626' },
      { key: 'vipColor',    label: 'VIP row color',   type: 'color',  default: '#b45309' },
    ],
    build(p) {
      const seats = [];
      const screenW = (p.seatsPerRow + 2) * (p.seatW + 2);
      const screenH = 22;

      // Screen
      const screenY = -(p.rows * p.rowSpacing) / 2 - p.arcRadius * 0.15 - screenH - 20;
      seats.push(rElem(0, screenY, screenW, screenH, p.screenColor,
        { label: 'SCREEN', lfs: 14, lfw: 'bold', lc: '#0f172a', sw: 1, stroke: '#cbd5e1' }));

      const span = Math.PI * 0.55;
      for (let row = 0; row < p.rows; row++) {
        const radius = p.arcRadius + row * p.rowSpacing;
        const isVip = row >= p.rows - 2;
        const fill = isVip ? p.vipColor : p.seatColor;
        const rowLetter = String.fromCharCode(65 + row);

        let col = 0;
        for (let c = 0; c < p.seatsPerRow; c++) {
          if (c === p.aisleCol && p.aisleCol > 0) col += 1.5; // aisle gap
          const t = p.seatsPerRow === 1 ? 0.5 : c / (p.seatsPerRow - 1);
          const angle = Math.PI + span / 2 - t * span;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle) + p.arcRadius * 0.85 - (p.rows * p.rowSpacing) / 2;
          const rot = ((angle - Math.PI) * 180) / Math.PI;
          seats.push(rElem(x, y, p.seatW, p.seatH, fill, { sw: 0.8, rot }));
          col++;
        }

        // Row label
        const la = Math.PI + span / 2 + 0.08;
        const lx = (radius - p.seatW) * Math.cos(la);
        const ly = (radius - p.seatH / 2) * Math.sin(la) + p.arcRadius * 0.85 - (p.rows * p.rowSpacing) / 2;
        seats.push(tLabel(lx, ly, rowLetter, 11, '#94a3b8'));
      }
      return seats;
    },
  },

  // ── 5. Classroom Layout ───────────────────────────────────────────────────
  {
    id: 'classroom-layout',
    name: 'Classroom',
    description: 'Desks, chairs, whiteboard and teacher area',
    icon: '📚',
    paramDefs: [
      { key: 'rows',       label: 'Student rows',    type: 'number', min: 1, max: 8,  default: 4  },
      { key: 'cols',       label: 'Columns',         type: 'number', min: 1, max: 10, default: 5  },
      { key: 'deskW',      label: 'Desk width',      type: 'number', min: 40, max: 120, default: 70 },
      { key: 'deskH',      label: 'Desk height',     type: 'number', min: 24, max: 60,  default: 36 },
      { key: 'hGap',       label: 'Horizontal gap',  type: 'number', min: 8,  max: 60,  default: 24 },
      { key: 'vGap',       label: 'Vertical gap',    type: 'number', min: 8,  max: 60,  default: 40 },
      { key: 'boardColor', label: 'Board color',     type: 'color',  default: '#16a34a' },
      { key: 'deskColor',  label: 'Desk color',      type: 'color',  default: '#92400e' },
      { key: 'chairColor', label: 'Chair color',     type: 'color',  default: '#3b82f6' },
    ],
    build(p) {
      const seats = [];
      const seatR = 12;
      const cellW = p.deskW + p.hGap;
      const cellH = p.deskH + seatR * 2 + 8 + p.vGap;
      const totalW = (p.cols - 1) * cellW;
      const totalH = (p.rows - 1) * cellH;

      const boardW = totalW + p.deskW + 60, boardH = 18;
      const boardY = -totalH / 2 - cellH * 0.6;

      // Whiteboard
      seats.push(rElem(0, boardY, boardW, boardH, p.boardColor,
        { label: 'Whiteboard', lfs: 11, lfw: 'bold', lc: '#f0fdf4', sw: 2, stroke: '#15803d' }));

      // Teacher desk
      seats.push(rElem(0, boardY + boardH / 2 + 30, 90, 40, '#78716c',
        { label: 'Teacher', lfs: 11, lfw: 'bold', lc: '#e7e5e4', sw: 2 }));

      // Student desks + chairs
      for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
          const x = -totalW / 2 + c * cellW;
          const y = -totalH / 2 + r * cellH + 80;
          seats.push(cSeat(x, y + seatR, seatR, p.chairColor));
          seats.push(rElem(x, y + seatR * 2 + 8 + p.deskH / 2, p.deskW, p.deskH, p.deskColor,
            { sw: 1.2 }));
        }
      }
      return seats;
    },
  },

  // ── 6. Office Space ──────────────────────────────────────────────────────
  {
    id: 'office-space',
    name: 'Office Space',
    description: 'Desk pods, meeting room and break area',
    icon: '🏢',
    paramDefs: [
      { key: 'podRows',      label: 'Pod rows',          type: 'number', min: 1, max: 5,  default: 2  },
      { key: 'podCols',      label: 'Pod columns',       type: 'number', min: 1, max: 5,  default: 3  },
      { key: 'deskW',        label: 'Desk width',        type: 'number', min: 30, max: 80, default: 55 },
      { key: 'deskH',        label: 'Desk height',       type: 'number', min: 24, max: 60, default: 36 },
      { key: 'podGapH',      label: 'Pod H gap',         type: 'number', min: 20, max: 80, default: 40 },
      { key: 'podGapV',      label: 'Pod V gap',         type: 'number', min: 20, max: 80, default: 50 },
      { key: 'meetingSeats', label: 'Meeting seats',     type: 'number', min: 4, max: 12,  default: 6  },
      { key: 'deskColor',    label: 'Desk color',        type: 'color',  default: '#475569' },
      { key: 'chairColor',   label: 'Chair color',       type: 'color',  default: '#0ea5e9' },
      { key: 'meetingColor', label: 'Meeting table clr', type: 'color',  default: '#78716c' },
    ],
    build(p) {
      const seats = [];
      const podW = p.deskW * 2 + 8;
      const podH = p.deskH * 2 + 8;
      const cellW = podW + p.podGapH;
      const cellH = podH + p.podGapV;
      const totalW = (p.podCols - 1) * cellW;
      const totalH = (p.podRows - 1) * cellH;

      // Desk pods (2x2 cluster each)
      for (let pr = 0; pr < p.podRows; pr++) {
        for (let pc = 0; pc < p.podCols; pc++) {
          const px = -totalW / 2 + pc * cellW;
          const py = -totalH / 2 + pr * cellH;
          // 4 desks facing inward in 2x2 arrangement
          const offsets = [
            { ox: -p.deskW / 2 - 4, oy: -p.deskH / 2 - 4, rot: 0   },
            { ox:  p.deskW / 2 + 4, oy: -p.deskH / 2 - 4, rot: 0   },
            { ox: -p.deskW / 2 - 4, oy:  p.deskH / 2 + 4, rot: 180 },
            { ox:  p.deskW / 2 + 4, oy:  p.deskH / 2 + 4, rot: 180 },
          ];
          offsets.forEach(({ ox, oy, rot }) => {
            seats.push(rElem(px + ox, py + oy, p.deskW, p.deskH, p.deskColor,
              { sw: 1, rot }));
            // Chair in front of each desk
            const chairOY = rot === 0 ? oy - p.deskH / 2 - 10 : oy + p.deskH / 2 + 10;
            seats.push(cSeat(px + ox, py + chairOY, 10, p.chairColor));
          });
        }
      }

      // Meeting room (right side)
      const mrX = totalW / 2 + cellW * 0.75;
      const mrTableR = 36;
      seats.push(rElem(mrX, 0, mrTableR * 2 + 60, mrTableR * 2 + 60, '#1e293b',
        { label: '', sw: 1.5, stroke: '#334155' }));
      seats.push(cSeat(mrX, 0, mrTableR, p.meetingColor, 'Mtg', 2));
      const orbit = mrTableR + 18;
      for (let i = 0; i < p.meetingSeats; i++) {
        const a = (2 * Math.PI * i) / p.meetingSeats - Math.PI / 2;
        seats.push(cSeat(mrX + orbit * Math.cos(a), orbit * Math.sin(a), 11, p.chairColor));
      }
      seats.push(tLabel(mrX, mrTableR + 44, 'Meeting Room', 11, '#94a3b8'));

      // Break area (bottom)
      const brY = totalH / 2 + cellH * 0.65;
      seats.push(rElem(0, brY, Math.max(totalW * 0.5, 120), 50, '#1e293b',
        { label: 'Break Area', lfs: 12, lfw: 'bold', lc: '#94a3b8', sw: 1.5, stroke: '#334155' }));
      const coffeeR = 14;
      seats.push(cSeat(-30, brY, coffeeR, '#92400e', '☕', 2));
      seats.push(cSeat(30,  brY, coffeeR, '#92400e', '🍵', 2));

      return seats;
    },
  },
];

// ── bbox helper (same as templates.js) ──────────────────────────────────────
export function getLayoutBBox(seats) {
  if (!seats.length) return { minX: -100, minY: -100, maxX: 100, maxY: 100 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  seats.forEach(s => {
    if (s.type === 'circle') {
      minX = Math.min(minX, s.x - s.r);  minY = Math.min(minY, s.y - s.r);
      maxX = Math.max(maxX, s.x + s.r);  maxY = Math.max(maxY, s.y + s.r);
    } else if (s.type === 'text') {
      const approxW = (s.text?.length || 4) * (s.fontSize || 12) * 0.6;
      minX = Math.min(minX, s.x - approxW / 2); minY = Math.min(minY, s.y - (s.fontSize || 12));
      maxX = Math.max(maxX, s.x + approxW / 2); maxY = Math.max(maxY, s.y + 4);
    } else {
      const hw = (s.width || 60) / 2, hh = (s.height || 40) / 2;
      minX = Math.min(minX, s.x - hw); minY = Math.min(minY, s.y - hh);
      maxX = Math.max(maxX, s.x + hw); maxY = Math.max(maxY, s.y + hh);
    }
  });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
