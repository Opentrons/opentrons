import { format, parseISO } from 'date-fns'
import type {
  FetchPipettesResponseBody,
  FetchPipettesResponsePipette,
  Mount,
} from '../../redux/pipettes/types'
import type { PipetteOffsetCalibration } from '@opentrons/api-client'

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

/**
 * Downloads a file containing the specified data as a JSON file with the given file name.
 * @param {object} data - The data to download as a file.
 * @param {string} fileName - The name to use for the downloaded file.
 * @returns {void}
 */
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

/**
 * Check if a 96-channel pipette is attached to the left mount.
 *
 * @param {FetchPipettesResponsePipette|null} leftMountAttachedPipette - Pipette attached to the left mount.
 * @returns {boolean} True if a 96-channel pipette is attached to the left mount, false otherwise.
 */
export function getIs96ChannelPipetteAttached(
  leftMountAttachedPipette: FetchPipettesResponsePipette | null
): boolean {
  const pipetteName = leftMountAttachedPipette?.name

  return pipetteName === 'p1000_96'
}

/**
 * Get the offset calibration for a given mount.
 *
 * @param {PipetteOffsetCalibration[]|null} pipetteOffsetCalibrations - List of pipette offset calibrations.
 * @param {FetchPipettesResponseBody|{left: undefined; right: undefined}} attachedPipettes - Object with the pipettes attached to the mounts.
 * @param {Mount} mount - Mount to get the offset calibration for.
 * @returns {PipetteOffsetCalibration|null} The offset calibration for the given mount, or null if it does not exist.
 */
export function getOffsetCalibrationForMount(
  pipetteOffsetCalibrations: PipetteOffsetCalibration[] | null,
  attachedPipettes:
    | FetchPipettesResponseBody
    | { left: undefined; right: undefined },
  mount: Mount
): PipetteOffsetCalibration | null {
  if (pipetteOffsetCalibrations == null) {
    return null
  } else {
    return (
      pipetteOffsetCalibrations.find(
        cal =>
          cal.mount === mount && cal.pipette === attachedPipettes[mount]?.id
      ) || null
    )
  }
}
