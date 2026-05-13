let _counter = 1;

function uid() {
  return `seat-${Date.now()}-${_counter++}`;
}

export function createSeat(type, x, y) {
  const base = { id: uid(), type, x, y, rotation: 0, groupId: null };

  switch (type) {
    case 'square':
      return {
        ...base,
        width: 60, height: 60,
        fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2,
        label: '', labelFontSize: 13, labelColor: '#ffffff', labelFontWeight: 'normal',
      };
    case 'rect':
      return {
        ...base,
        width: 110, height: 60,
        fill: '#3b82f6', stroke: '#1d4ed8', strokeWidth: 2,
        label: '', labelFontSize: 13, labelColor: '#ffffff', labelFontWeight: 'normal',
      };
    case 'circle':
      return {
        ...base,
        r: 32,
        fill: '#8b5cf6', stroke: '#6d28d9', strokeWidth: 2,
        label: '', labelFontSize: 13, labelColor: '#ffffff', labelFontWeight: 'normal',
      };
    case 'text':
      return {
        ...base,
        text: 'Text', fontSize: 18,
        fill: '#1e293b', stroke: 'none', strokeWidth: 0,
        fontFamily: 'sans-serif', fontWeight: 'normal',
      };
    default:
      return base;
  }
}
