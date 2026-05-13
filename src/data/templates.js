// Template definitions — each exports a name, param schema, and a build() function.
// build(params, cx, cy) returns an array of seat objects (no groupId set yet).

let _c = 0;
function uid() { return `tmpl-${Date.now()}-${_c++}`; }

function makeCircleSeat(x, y, r, color, label = '') {
  return {
    id: uid(), type: 'circle',
    x, y, r,
    fill: color, stroke: darken(color), strokeWidth: 2,
    label, labelFontSize: Math.max(9, Math.round(r * 0.55)),
    labelColor: '#ffffff', labelFontWeight: 'normal',
    rotation: 0, groupId: null,
  };
}

function makeRectSeat(x, y, w, h, color, label = '', rotation = 0) {
  return {
    id: uid(), type: 'rect',
    x, y, width: w, height: h,
    fill: color, stroke: darken(color), strokeWidth: 2,
    label, labelFontSize: 11,
    labelColor: '#ffffff', labelFontWeight: 'normal',
    rotation, groupId: null,
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

export const TEMPLATES = [
  // ── Template 1: Rectangle table with seats on all sides ──────────────────
  {
    id: 'rect-table',
    name: 'Table + Seats',
    description: 'Rectangular table with seats distributed on each side',
    paramDefs: [
      { key: 'seatsTop',    label: 'Seats — top',    type: 'number', min: 0, max: 16, default: 4 },
      { key: 'seatsBottom', label: 'Seats — bottom', type: 'number', min: 0, max: 16, default: 4 },
      { key: 'seatsLeft',   label: 'Seats — left',   type: 'number', min: 0, max: 10, default: 2 },
      { key: 'seatsRight',  label: 'Seats — right',  type: 'number', min: 0, max: 10, default: 2 },
      { key: 'tableW',      label: 'Table width',    type: 'number', min: 60, max: 600, default: 220 },
      { key: 'tableH',      label: 'Table height',   type: 'number', min: 40, max: 400, default: 100 },
      { key: 'seatSize',    label: 'Seat diameter',  type: 'number', min: 12, max: 80,  default: 36 },
      { key: 'gap',         label: 'Gap from table', type: 'number', min: 4,  max: 60,  default: 14 },
      { key: 'tableColor',  label: 'Table color',    type: 'color',  default: '#78716c' },
      { key: 'seatColor',   label: 'Seat color',     type: 'color',  default: '#3b82f6' },
    ],
    build(p, cx = 0, cy = 0) {
      const seats = [];
      const hw = p.tableW / 2, hh = p.tableH / 2;
      const r  = p.seatSize / 2;

      // Table
      seats.push({
        id: uid(), type: 'rect',
        x: cx, y: cy, width: p.tableW, height: p.tableH,
        fill: p.tableColor, stroke: darken(p.tableColor), strokeWidth: 2,
        label: 'Table', labelFontSize: 14, labelColor: '#fff', labelFontWeight: 'bold',
        rotation: 0, groupId: null,
      });

      const place = (count, getXY) => {
        for (let i = 0; i < count; i++) {
          const { x, y } = getXY(i, count);
          seats.push(makeCircleSeat(x, y, r, p.seatColor));
        }
      };

      place(p.seatsTop,    (i, n) => ({ x: cx - hw + (p.tableW / (n + 1)) * (i + 1), y: cy - hh - p.gap - r }));
      place(p.seatsBottom, (i, n) => ({ x: cx - hw + (p.tableW / (n + 1)) * (i + 1), y: cy + hh + p.gap + r }));
      place(p.seatsLeft,   (i, n) => ({ x: cx - hw - p.gap - r, y: cy - hh + (p.tableH / (n + 1)) * (i + 1) }));
      place(p.seatsRight,  (i, n) => ({ x: cx + hw + p.gap + r, y: cy - hh + (p.tableH / (n + 1)) * (i + 1) }));

      return seats;
    },
  },

  // ── Template 2: Round table ───────────────────────────────────────────────
  {
    id: 'round-table',
    name: 'Round Table',
    description: 'Circular table with seats arranged evenly around it',
    paramDefs: [
      { key: 'seatCount',   label: 'Number of seats', type: 'number', min: 2, max: 24, default: 8 },
      { key: 'tableRadius', label: 'Table radius',    type: 'number', min: 30, max: 200, default: 65 },
      { key: 'seatRadius',  label: 'Seat radius',     type: 'number', min: 8,  max: 50,  default: 20 },
      { key: 'gap',         label: 'Gap',             type: 'number', min: 4,  max: 60,  default: 14 },
      { key: 'tableColor',  label: 'Table color',     type: 'color',  default: '#78716c' },
      { key: 'seatColor',   label: 'Seat color',      type: 'color',  default: '#8b5cf6' },
    ],
    build(p, cx = 0, cy = 0) {
      const seats = [];
      seats.push({
        id: uid(), type: 'circle',
        x: cx, y: cy, r: p.tableRadius,
        fill: p.tableColor, stroke: darken(p.tableColor), strokeWidth: 2,
        label: 'Table', labelFontSize: 14, labelColor: '#fff', labelFontWeight: 'bold',
        rotation: 0, groupId: null,
      });
      const orbit = p.tableRadius + p.gap + p.seatRadius;
      for (let i = 0; i < p.seatCount; i++) {
        const a = (2 * Math.PI * i) / p.seatCount - Math.PI / 2;
        seats.push(makeCircleSeat(cx + orbit * Math.cos(a), cy + orbit * Math.sin(a), p.seatRadius, p.seatColor));
      }
      return seats;
    },
  },

  // ── Template 3: Theater arc ───────────────────────────────────────────────
  {
    id: 'theater-arc',
    name: 'Theater Arc',
    description: 'Curved rows of seats like a theater or auditorium',
    paramDefs: [
      { key: 'rows',       label: 'Rows',          type: 'number', min: 1, max: 8,  default: 3 },
      { key: 'seatsPerRow',label: 'Seats per row', type: 'number', min: 3, max: 20, default: 9 },
      { key: 'seatW',      label: 'Seat width',    type: 'number', min: 20, max: 80, default: 38 },
      { key: 'seatH',      label: 'Seat height',   type: 'number', min: 16, max: 60, default: 30 },
      { key: 'arcRadius',  label: 'Arc radius',    type: 'number', min: 100, max: 900, default: 300 },
      { key: 'rowSpacing', label: 'Row spacing',   type: 'number', min: 10, max: 80,  default: 52 },
      { key: 'seatColor',  label: 'Seat color',    type: 'color',  default: '#3b82f6' },
    ],
    build(p, cx = 0, cy = 0) {
      const seats = [];
      const span = Math.PI * 0.72;
      for (let row = 0; row < p.rows; row++) {
        const radius = p.arcRadius + row * p.rowSpacing;
        for (let col = 0; col < p.seatsPerRow; col++) {
          const t = p.seatsPerRow === 1 ? 0.5 : col / (p.seatsPerRow - 1);
          const angle = Math.PI + span / 2 - t * span;  // bottom half of circle
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle) + p.arcRadius;
          const rot = ((angle - Math.PI) * 180) / Math.PI;
          seats.push(makeRectSeat(x, y, p.seatW, p.seatH, p.seatColor, '', rot));
        }
      }
      return seats;
    },
  },

  // ── Template 4: Classroom grid ────────────────────────────────────────────
  {
    id: 'classroom',
    name: 'Classroom',
    description: 'Grid of desks each with a seat in front',
    paramDefs: [
      { key: 'rows',      label: 'Rows',         type: 'number', min: 1, max: 10, default: 4 },
      { key: 'cols',      label: 'Columns',      type: 'number', min: 1, max: 12, default: 5 },
      { key: 'deskW',     label: 'Desk width',   type: 'number', min: 40, max: 160, default: 72 },
      { key: 'deskH',     label: 'Desk height',  type: 'number', min: 24, max: 80,  default: 38 },
      { key: 'spacingX',  label: 'H. gap',       type: 'number', min: 8,  max: 80,  default: 28 },
      { key: 'spacingY',  label: 'V. gap',       type: 'number', min: 8,  max: 80,  default: 44 },
      { key: 'deskColor', label: 'Desk color',   type: 'color',  default: '#78716c' },
      { key: 'seatColor', label: 'Seat color',   type: 'color',  default: '#3b82f6' },
    ],
    build(p, cx = 0, cy = 0) {
      const seats = [];
      const seatR   = 14;
      const cellH   = p.deskH + seatR * 2 + 8 + p.spacingY;
      const cellW   = p.deskW + p.spacingX;
      const totalW  = (p.cols - 1) * cellW;
      const totalH  = (p.rows - 1) * cellH;
      const ox = cx - totalW / 2;
      const oy = cy - totalH / 2;

      for (let r = 0; r < p.rows; r++) {
        for (let c = 0; c < p.cols; c++) {
          const x = ox + c * cellW;
          const y = oy + r * cellH;
          seats.push(makeRectSeat(x, y + seatR * 2 + 6, p.deskW, p.deskH, p.deskColor));
          seats.push(makeCircleSeat(x, y + seatR, seatR, p.seatColor));
        }
      }
      return seats;
    },
  },
];

// ── shared preview helper ─────────────────────────────────────────────────────
export function getTemplateBBox(seats) {
  if (!seats.length) return { minX: -50, minY: -50, maxX: 50, maxY: 50 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  seats.forEach(s => {
    if (s.type === 'circle') {
      minX = Math.min(minX, s.x - s.r); minY = Math.min(minY, s.y - s.r);
      maxX = Math.max(maxX, s.x + s.r); maxY = Math.max(maxY, s.y + s.r);
    } else {
      const hw = (s.width || 60) / 2, hh = (s.height || 40) / 2;
      minX = Math.min(minX, s.x - hw); minY = Math.min(minY, s.y - hh);
      maxX = Math.max(maxX, s.x + hw); maxY = Math.max(maxY, s.y + hh);
    }
  });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
