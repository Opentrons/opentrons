import { describe, expect, it } from 'vitest'

import {
  FileSaveCanceledError,
  isFileSaveCanceledError,
} from '../fileSaveCanceledError'

describe('isFileSaveCanceledError', () => {
  it('is true for FileSaveCanceledError', () => {
    expect(isFileSaveCanceledError(new FileSaveCanceledError())).toBe(true)
  })

  it('is true for IPC-shaped cancel errors', () => {
    const error = new Error('File save canceled')
    error.name = 'FileSaveCanceledError'
    expect(isFileSaveCanceledError(error)).toBe(true)
  })

  it('is false for other errors', () => {
    expect(isFileSaveCanceledError(new Error('nope'))).toBe(false)
  })
})
