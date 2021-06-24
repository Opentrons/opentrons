import padStart from 'lodash/padStart'
import { format } from 'date-fns'

export function formatSeconds(value: number): string {
  const hours = padStart(`${Math.floor(value / 3600)}`, 2, '0')
  const minutes = padStart(`${Math.floor(value / 60) % 60}`, 2, '0')
  const seconds = padStart(`${value % 60}`, 2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function formatTime(time: number | null | undefined): string {
  return time ? format(time, 'pp') : ''
}
