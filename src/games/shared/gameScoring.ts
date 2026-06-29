export function accuracyToStars(accuracy: number) {
  if (accuracy >= 90) return 5;
  if (accuracy >= 80) return 4;
  if (accuracy >= 65) return 3;
  if (accuracy >= 45) return 2;
  return 1;
}

export function averageAccuracy(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function centsOff(targetHz: number, currentHz: number) {
  if (!targetHz || !currentHz) return Infinity;
  return Math.abs(1200 * Math.log2(currentHz / targetHz));
}

export function isPitchInRange(targetHz: number, currentHz: number, toleranceCents = 30) {
  return centsOff(targetHz, currentHz) <= toleranceCents;
}

export function mapPitchToStaffY(hz: number, minHz: number, maxHz: number, height: number) {
  const clamped = Math.max(minHz, Math.min(maxHz, hz));
  const ratio = (clamped - minHz) / (maxHz - minHz);
  return height - ratio * height;
}
