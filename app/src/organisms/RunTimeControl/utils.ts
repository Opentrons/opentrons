import { intervalToDuration, Duration } from 'date-fns'
import padStart from 'lodash/padStart'

/**
 * utility to format a date-fns duration object to hh:mm:ss
 * @param duration date-fns duration object
 * @returns string in format hh:mm:ss, e.g. 03:15:45
 */
export function formatDuration(duration: Duration): string {
  const { days, hours, minutes, seconds } = duration

  // edge case: protocol runs (or is paused) for over 24 hours
  const hoursWithDays = days != null ? days * 24 + (hours ?? 0) : hours

  const paddedHours = padStart(hoursWithDays?.toString(), 2, '0')
  const paddedMinutes = padStart(minutes?.toString(), 2, '0')
  const paddedSeconds = padStart(seconds?.toString(), 2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}

/**
 * utility to format a date interval to a hh:mm:ss duration
 * @param start date string
 * @param end date string
 * @returns string in format hh:mm:ss, e.g. 03:15:45
 */
export function formatInterval(start: string, end: string): string {
    console.log(start)
    console.log(new Date(start))
  const duration = intervalToDuration({
    start: new Date(start),
    end: new Date(end),
  })
  return formatDuration(duration)
}
