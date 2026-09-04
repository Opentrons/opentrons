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

/**
 * Prompt the user to choose a save location, then write `data` to that file.
 *
 * Resolves only after the user confirms Save. Canceling the dialog rejects
 * with `FileSaveCanceledError` so callers can skip toasts and follow-up work
 * such as delete.
 *
 * File type filters are inferred from the filename extension (`.zip`, `.json`).
 */
export function saveFileWithPicker(
  filename: string,
  data: ArrayBuffer | Blob
): Promise<void> {
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker
  if (picker == null) {
    return Promise.reject(new Error('Save file picker is not available'))
  }

  const types = getSaveFilePickerTypes(filename)

  return picker({
    suggestedName: filename,
    ...(types.length > 0 ? { types } : {}),
  })
    .then(handle => handle.createWritable())
    .then(writable => writable.write(data).then(() => writable.close()))
    .catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new FileSaveCanceledError()
      }
      throw error
    })
}

function getSaveFilePickerTypes(filename: string): Array<{
  description: string
  accept: Record<string, string[]>
}> {
  const extension = filename.includes('.')
    ? filename.slice(filename.lastIndexOf('.'))
    : ''

  if (extension === '.json') {
    return [
      {
        description: 'JSON',
        accept: { 'application/json': ['.json'] },
      },
    ]
  }

  if (extension === '.zip') {
    return [
      {
        description: 'ZIP archive',
        accept: { 'application/zip': ['.zip'] },
      },
    ]
  }

  return []
}
