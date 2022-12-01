import { format, parseISO } from 'date-fns'
import type { FetchPipettesResponsePipette } from '../../redux/pipettes/types'

/**
 * formats a string if it is in ISO 8601 date format
 * @param {string} timestamp ISO date string
 * @returns {string} formatted date string
 */
export function formatTimestamp(timestamp: string): string {
  // eslint-disable-next-line eqeqeq
  return (parseISO(timestamp) as Date | string) != 'Invalid Date'
    ? format(parseISO(timestamp), 'MM/dd/yyyy HH:mm:ss')
    : timestamp
}

export function downloadFile(data: object, fileName: string): void {
  // Create a blob with the data we want to download as a file
  const blob = new Blob([JSON.stringify(data)], { type: 'text/json' })
  // Create an anchor element and dispatch a click event on it
  // to trigger a download
  const a = document.createElement('a')
  a.download = fileName
  a.href = window.URL.createObjectURL(blob)
  const clickEvt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  a.dispatchEvent(clickEvt)
  a.remove()
}

export function getIs96ChannelPipetteAttached(
  leftMountAttachedPipette: FetchPipettesResponsePipette | null
): boolean {
  const pipetteName = leftMountAttachedPipette?.name

  return pipetteName === 'p1000_96'
}
