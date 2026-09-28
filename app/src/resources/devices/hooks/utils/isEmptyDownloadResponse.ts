export function isEmptyDownloadResponse(
  data: unknown,
  status: number
): boolean {
  if (status === 204) {
    return true
  }
  if (data instanceof Blob) {
    return data.size === 0
  }
  return data == null || data === ''
}

/**
 * True when main-process saveFileFromUrl rejected because the robot returned
 * an empty download (HTTP 204), matching the old getRunRaw soft-skip path.
 */
export function isEmptyDownloadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  return (
    error.name === 'EmptyDownloadError' ||
    error.message.includes('Empty download')
  )
}
