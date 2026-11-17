export class FileSaveCanceledError extends Error {
  readonly isFileSaveCanceled = true

  constructor() {
    super('File save canceled')
    this.name = 'FileSaveCanceledError'
  }
}

export function isFileSaveCanceledError(error: unknown): boolean {
  if (error instanceof FileSaveCanceledError) {
    return true
  }
  // Errors thrown from the main process arrive over IPC without the original class
  if (error instanceof Error) {
    return (
      error.name === 'FileSaveCanceledError' ||
      error.message.includes('File save canceled')
    )
  }
  return false
}
