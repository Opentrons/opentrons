import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  FileSaveCanceledError,
  isFileSaveCanceledError,
  saveFileWithPicker,
} from '../saveFileWithPicker'

describe('saveFileWithPicker', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('writes the file after the user confirms the picker', () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const close = vi.fn().mockResolvedValue(undefined)
    const showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    })
    vi.stubGlobal('showSaveFilePicker', showSaveFilePicker)

    const buffer = new ArrayBuffer(4)
    return saveFileWithPicker('otie-run-records.zip', buffer).then(() => {
      expect(showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'otie-run-records.zip',
        types: [
          {
            description: 'ZIP archive',
            accept: { 'application/zip': ['.zip'] },
          },
        ],
      })
      expect(write).toHaveBeenCalledWith(buffer)
      expect(close).toHaveBeenCalled()
    })
  })

  it('throws FileSaveCanceledError when the user cancels', () => {
    vi.stubGlobal(
      'showSaveFilePicker',
      vi.fn().mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      )
    )

    return expect(
      saveFileWithPicker('otie-run-records.zip', new ArrayBuffer(0))
    ).rejects.toBeInstanceOf(FileSaveCanceledError)
  })
})

describe('isFileSaveCanceledError', () => {
  it('is true for FileSaveCanceledError', () => {
    expect(isFileSaveCanceledError(new FileSaveCanceledError())).toBe(true)
  })

  it('is false for other errors', () => {
    expect(isFileSaveCanceledError(new Error('nope'))).toBe(false)
  })
})
