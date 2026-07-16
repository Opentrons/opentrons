/**
 * A helper function that calculates the display multiplier (x) from milliSecondsPerFrame,
 * using 1 second = 1000 ms = 1x as the baseline.
 */

export function getSpeedMultiplierText(milliSecondsPerFrame: number): string {
  const seconds = milliSecondsPerFrame / 1000
  if (seconds === 0.25) return '4x'
  if (seconds === 0.5) return '2x'
  if (seconds === 1) return '1x'
  if (seconds === 2) return '0.5x'
  if (seconds === 3) return '0.33x'
  return `${(1 / seconds).toFixed(2)}x`
}
