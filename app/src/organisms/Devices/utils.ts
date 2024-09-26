import type {
  FetchPipettesResponseBody,
  FetchPipettesResponsePipette,
  Mount,
} from '/app/redux/pipettes/types'
import type { PipetteOffsetCalibration } from '@opentrons/api-client'

export function downloadFile(data: object | string, fileName: string): void {
  // Create a blob with the data we want to download as a file
  const blobContent = typeof data === 'string' ? data : JSON.stringify(data)
  const blob = new Blob([blobContent], { type: 'text/json' })
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
