type FormattedTimeOutputFormat = 'mmss' | 'hhmmss'

/**
 * Format a time string as MM:SS or HH:MM:SS. Parts are interpreted right-to-left (rightmost is seconds).
 * - No colon (e.g. "45") → seconds only.
 * - One colon (e.g. "5:30") → minutes:seconds.
 * - Two colons (e.g. "1:5:30") → hours:minutes:seconds.
 *
 * @param time - Input time string (seconds, M:S, or H:M:S).
 * @param outputFormat - 'MM:SS' (default) or 'HH:MM:SS'. When 'MM:SS', times with hours are collapsed to total minutes:seconds.
 */
export const getFormattedTime = (
  time: string,
  outputFormat: FormattedTimeOutputFormat = 'mmss'
): string => {
  const parts = time.split(':')
  let hours = 0
  let minutes = 0
  let seconds = 0
  if (parts.length >= 3) {
    hours = parts[0] !== '' ? Number(parts[0]) : 0
    minutes = parts[1] !== '' ? Number(parts[1]) : 0
    seconds = parts[2] !== '' ? Number(parts[2]) : 0
  } else if (parts.length === 2) {
    minutes = parts[0] !== '' ? Number(parts[0]) : 0
    seconds = parts[1] !== '' ? Number(parts[1]) : 0
  } else {
    seconds = parts[0] !== '' ? Number(parts[0]) : 0
  }

  if (outputFormat === 'hhmmss') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  const totalMinutes = hours * 60 + minutes
  return `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
