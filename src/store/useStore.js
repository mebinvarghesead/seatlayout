import { create } from 'zustand';

const MAX_HISTORY = 60;

function snap(state) {
  return {
    seats: state.seats.map(s => ({ ...s })),
    groups: state.groups.map(g => ({ ...g, seatIds: [...g.seatIds] })),
  };
}

export const useStore = create((set, get) => {
  function pushHistory() {
    const state = get();
    const current = snap(state);
    const past = state.past.length >= MAX_HISTORY
      ? state.past.slice(1)
      : state.past;
    set({ past: [...past, current], future: [] });
  }

  return {
    // ── mode ─────────────────────────────────────────────
    mode: 'free',
    setMode(mode) {
      set({ mode, selectedIds: [] });
    },

    // ── placement type ────────────────────────────────────
    placementType: 'square',
    setPlacementType(type) {
      set({ placementType: type });
    },

    // ── viewport center (updated by Canvas on zoom/pan) ──
    viewportCenter: { x: 0, y: 0 },
    setViewportCenter(x, y) { set({ viewportCenter: { x, y } }); },

    // ── canvas data ───────────────────────────────────────
    seats: [],
    groups: [],

    // ── selection ─────────────────────────────────────────
    selectedIds: [],

    setSelectedIds(ids) {
      set({ selectedIds: ids });
    },

    toggleSelection(id, multi) {
      const { selectedIds } = get();
      if (multi) {
        set({
          selectedIds: selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id],
        });
      } else {
        set({ selectedIds: [id] });
      }
    },

    clearSelection() {
      set({ selectedIds: [] });
    },

    // ── seats ─────────────────────────────────────────────
    addSeat(seat) {
      pushHistory();
      set(s => ({ seats: [...s.seats, seat] }));
    },

    updateSeat(id, props) {
      set(s => ({
        seats: s.seats.map(seat => (seat.id === id ? { ...seat, ...props } : seat)),
      }));
    },

    // No-history bulk update used during live dragging
    batchUpdateSeats(updates) {
      const map = new Map(updates.map(u => [u.id, u]));
      set(s => ({
        seats: s.seats.map(seat => {
          const u = map.get(seat.id);
          return u ? { ...seat, ...u } : seat;
        }),
      }));
    },

    // Push a previously captured snapshot as an undo checkpoint
    pushSnapshot(snapshot) {
      const state = get();
      const past = state.past.length >= MAX_HISTORY
        ? state.past.slice(1)
        : state.past;
      set({ past: [...past, snapshot], future: [] });
    },

    // Bulk add — seats are pre-positioned relative to canvas origin (0,0);
    // they are offset to viewportCenter automatically.
    // shouldGroup=true creates a group so the result moves as one unit.
    addBulkSeats(seats, shouldGroup = false) {
      const { viewportCenter } = get();
      pushHistory();
      const placed = seats.map(s => ({
        ...s,
        x: s.x + viewportCenter.x,
        y: s.y + viewportCenter.y,
      }));
      if (shouldGroup && placed.length > 1) {
        const groupId = crypto.randomUUID();
        const grouped = placed.map(s => ({ ...s, groupId }));
        set(st => ({
          seats:  [...st.seats,  ...grouped],
          groups: [...st.groups, { id: groupId, seatIds: placed.map(s => s.id) }],
          selectedIds: placed.map(s => s.id),
        }));
      } else {
        set(st => ({
          seats:  [...st.seats, ...placed],
          selectedIds: placed.map(s => s.id),
        }));
      }
    },

    deleteSeat(id) {
      pushHistory();
      set(s => ({
        seats: s.seats.filter(seat => seat.id !== id),
        groups: s.groups
          .map(g => ({ ...g, seatIds: g.seatIds.filter(i => i !== id) }))
          .filter(g => g.seatIds.length > 1),
        selectedIds: s.selectedIds.filter(i => i !== id),
      }));
    },

    deleteSelected() {
      const { selectedIds } = get();
      if (!selectedIds.length) return;
      pushHistory();
      const del = new Set(selectedIds);
      set(s => ({
        seats: s.seats.filter(seat => !del.has(seat.id)),
        groups: s.groups
          .map(g => ({ ...g, seatIds: g.seatIds.filter(i => !del.has(i)) }))
          .filter(g => g.seatIds.length > 1),
        selectedIds: [],
      }));
    },

    // ── groups ────────────────────────────────────────────
    groupSelected() {
      const { selectedIds } = get();
      if (selectedIds.length < 2) return;
      pushHistory();
      const groupId = crypto.randomUUID();
      set(s => ({
        groups: [...s.groups, { id: groupId, seatIds: [...selectedIds] }],
        seats: s.seats.map(seat =>
          selectedIds.includes(seat.id) ? { ...seat, groupId } : seat
        ),
      }));
    },

    ungroupSelected() {
      const { selectedIds, groups } = get();
      const affected = groups.filter(g => g.seatIds.some(id => selectedIds.includes(id)));
      if (!affected.length) return;
      pushHistory();
      const affectedIds = new Set(affected.map(g => g.id));
      set(s => ({
        groups: s.groups.filter(g => !affectedIds.has(g.id)),
        seats: s.seats.map(seat =>
          affectedIds.has(seat.groupId) ? { ...seat, groupId: null } : seat
        ),
      }));
    },

    // ── undo / redo ───────────────────────────────────────
    past: [],
    future: [],

    undo() {
      const { past, future } = get();
      if (!past.length) return;
      const current = snap(get());
      const prev = past[past.length - 1];
      set({
        seats: prev.seats,
        groups: prev.groups,
        past: past.slice(0, -1),
        future: [current, ...future],
        selectedIds: [],
      });
    },

    redo() {
      const { past, future } = get();
      if (!future.length) return;
      const current = snap(get());
      const next = future[0];
      set({
        seats: next.seats,
        groups: next.groups,
        past: [...past, current],
        future: future.slice(1),
        selectedIds: [],
      });
    },
  };
});
