import { describe, expect, it } from 'vitest'

import { getFileType, validateFile } from '../fileUtils'

describe('getFileType', () => {
  it('accepts a .py file when MIME type is empty (Windows)', () => {
    const file = new File(['print(1)\n'], 'protocol.py', { type: '' })

    expect(getFileType(file)).toBe('python')
    expect(validateFile(file)).toEqual({ isValid: true })
  })

  it('accepts a .py file with a Python MIME type (macOS)', () => {
    const file = new File(['print(1)\n'], 'protocol.py', {
      type: 'text/x-python',
    })

    expect(getFileType(file)).toBe('python')
    expect(validateFile(file)).toEqual({ isValid: true })
  })

  it('rejects .csv and .pdf when MIME type is empty (server has no fallback)', () => {
    const csv = new File(['a,b\n'], 'data.csv', { type: '' })
    const pdf = new File(['%PDF-1.4'], 'doc.pdf', { type: '' })

    expect(getFileType(csv)).toBeNull()
    expect(getFileType(pdf)).toBeNull()
  })

  it('rejects an unknown extension when MIME type is empty', () => {
    const file = new File(['hello'], 'notes.txt', { type: '' })

    expect(getFileType(file)).toBeNull()
    expect(validateFile(file)).toEqual({
      isValid: false,
      error:
        'Unsupported file type. Please upload PDF, CSV, or Python (.py) files.',
    })
  })
})
