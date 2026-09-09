import { describe, expect, it } from 'vitest'

import {
  isEmptyDownloadError,
  isEmptyDownloadResponse,
} from '../isEmptyDownloadResponse'

describe('isEmptyDownloadResponse', () => {
  it('is true for HTTP 204', () => {
    expect(isEmptyDownloadResponse(null, 204)).toBe(true)
  })

  it('is true for an empty blob', () => {
    expect(isEmptyDownloadResponse(new Blob([]), 200)).toBe(true)
  })

  it('is false for a non-empty blob', () => {
    expect(isEmptyDownloadResponse(new Blob(['data']), 200)).toBe(false)
  })
})

describe('isEmptyDownloadError', () => {
  it('is true for EmptyDownloadError-shaped errors', () => {
    const error = new Error('Empty download')
    error.name = 'EmptyDownloadError'
    expect(isEmptyDownloadError(error)).toBe(true)
  })

  it('is true when the IPC message contains Empty download', () => {
    expect(
      isEmptyDownloadError(
        new Error('Error invoking remote method: Error: Empty download')
      )
    ).toBe(true)
  })

  it('is false for other errors', () => {
    expect(isEmptyDownloadError(new Error('network'))).toBe(false)
  })
})
