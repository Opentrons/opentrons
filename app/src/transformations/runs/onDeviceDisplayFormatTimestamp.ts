import { format, parseISO } from 'date-fns'
export function onDeviceDisplayFormatTimestamp(timestamp: string): string {
  // eslint-disable-next-line eqeqeq
  return (parseISO(timestamp) as Date | string) != 'Invalid Date'
    ? format(parseISO(timestamp), 'HH:mm:ss')
    : timestamp
}
