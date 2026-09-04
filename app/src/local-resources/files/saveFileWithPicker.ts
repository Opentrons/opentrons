export class FileSaveCanceledError extends Error {
  readonly isFileSaveCanceled = true

  constructor() {
    super('File save canceled')
    this.name = 'FileSaveCanceledError'
  }
}

export function isFileSaveCanceledError(error: unknown): boolean {
  return error instanceof FileSaveCanceledError
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: Array<{
      description?: string
      accept: Record<string, string[]>
    }>
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: BufferSource | Blob) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

export function saveFileWithPicker(
  filename: string,
  buffer: ArrayBuffer
): Promise<void> {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker
  if (picker == null) {
    return Promise.reject(new Error('Save file picker is not available'))
  }

  return picker({
    suggestedName: filename,
    types: [
      {
        description: 'ZIP archive',
        accept: { 'application/zip': ['.zip'] },
      },
    ],
  })
    .then(handle => handle.createWritable())
    .then(writable =>
      writable.write(buffer).then(() => writable.close())
    )
    .catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new FileSaveCanceledError()
      }
      throw error
    })
}
