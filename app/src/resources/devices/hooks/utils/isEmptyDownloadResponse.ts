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
