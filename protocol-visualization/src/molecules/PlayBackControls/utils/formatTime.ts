/**
 * A helper function that formats a number of seconds into either H:MM:SS or M:SS.
 */

export function formatTime(seconds: number, forceHoursFormat: boolean): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const formattedMins =
    forceHoursFormat || hrs > 0 ? String(mins).padStart(2, '0') : String(mins)
  const formattedSecs = String(secs).padStart(2, '0')

  if (forceHoursFormat || hrs > 0) {
    return `${hrs}:${formattedMins}:${formattedSecs}`
  }
  return `${formattedMins}:${formattedSecs}`
}
