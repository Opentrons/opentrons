/**
 * A helper function that calculates the display multiplier (x) from milliSecondsPerFrame,
 * using 1 second = 1000 ms = 1x as the baseline.
 */
const PRESET_SPEEDS: Record<number, string> = {
  0.25: '4x',
  0.5: '2x',
  1: '1x',
  2: '0.5x',
  3: '0.33x',
};

export function getSpeedMultiplierText(milliSecondsPerFrame: number): string {
  const seconds = milliSecondsPerFrame / 1000;
  return PRESET_SPEEDS[seconds] ?? `${(1 / seconds).toFixed(2)}x`;
}
