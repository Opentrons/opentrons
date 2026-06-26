import type {
  FetchPipettesResponseBody,
  FetchPipettesResponsePipette,
  Mount,
  PipetteOffsetCalibration,
} from '@opentrons/api-client'

export function downloadFile(
  data: Blob | string | object,
  fileName: string,
  mimeType?: string
): void {
  const createBlob = (data: Blob | string | object): Blob => {
    if (data instanceof Blob) {
      return data
    } else {
      const content = typeof data === 'string' ? data : JSON.stringify(data)
      return new Blob([content], { type: mimeType ?? 'text/json' })
    }
  }

  const blob = createBlob(data)

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = fileName
  a.href = url
  a.click()

  a.remove()
  window.URL.revokeObjectURL(url)
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
