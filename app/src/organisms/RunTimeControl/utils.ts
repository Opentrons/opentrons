import { formatDuration, intervalToDuration } from 'date-fns'
import padStart from 'lodash/padStart'

/**
 * utility to format a date interval to a hh:mm:ss duration
 * @param start date string
 * @param end date string
 * @returns string in format hh:mm:ss, e.g. 03:15:45
 */
export function formatInterval(start: string, end: string): string {
  const duration = intervalToDuration({
    start: new Date(start),
    end: new Date(end),
  })

  const formattedDuration = formatDuration(duration, {
    format: ['hours', 'minutes', 'seconds'],
    delimiter: ':',
    zero: true,
  })

  const numberDuration = formattedDuration.replace(/[^0-9:]/g, '')

  const numberDurationParts = numberDuration.split(':')

  const paddedNumberDurationParts = numberDurationParts.map(numberDuration =>
    padStart(numberDuration, 2, '0')
  )

  return paddedNumberDurationParts.join(':')
}
