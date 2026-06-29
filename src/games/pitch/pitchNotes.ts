export const PITCH_SCALE_NOTES = [
  { label: '높음', color: '#f472b6', hz: 360 },
  { label: '도', color: '#ef4444', hz: 330 },
  { label: '레', color: '#f97316', hz: 294 },
  { label: '미', color: '#facc15', hz: 262 },
  { label: '파', color: '#4caf3d', hz: 220 },
  { label: '솔', color: '#38bdf8', hz: 196 },
  { label: '낮음', color: '#8b5cf6', hz: 180 },
] as const;

export function getClosestNoteLabel(hz: number) {
  return PITCH_SCALE_NOTES.reduce((closest, note) => {
    if (!note.hz) return closest;
    const diff = Math.abs(note.hz - hz);
    return diff < closest.diff ? { label: note.label, diff } : closest;
  }, { label: '파', diff: Infinity }).label;
}
