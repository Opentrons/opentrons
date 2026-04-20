import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useApiCall } from '../useApiCall'

describe('useApiCall', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should post data successfully', async () => {
    const mockData = { message: 'Hello, World!' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({
        url: '/test',
        method: 'POST',
        data: mockData,
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
  })

  it('should handle network error as structured ApiErrorResponse', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({ url: '/test', method: 'POST', data: {} })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual({
      message: 'Network Error',
      errorType: 'network_error',
    })
  })

  it('should use API error response body (camelCase) as ApiErrorResponse', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Your request is too large.',
          errorType: 'context_length_exceeded',
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }
      )
    )

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({ url: '/test', method: 'POST', data: {} })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual({
      message: 'Your request is too large.',
      errorType: 'context_length_exceeded',
    })
  })

  it('should use 504 timeout error (camelCase) as ApiErrorResponse', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Your request timed out.',
          errorType: 'request_timeout',
        }),
        {
          status: 504,
          headers: { 'content-type': 'application/json' },
        }
      )
    )

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({ url: '/test', method: 'POST', data: {} })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toEqual({
      message: 'Your request timed out.',
      errorType: 'request_timeout',
    })
  })

  it('should clear error when clearError is called', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network Error'))

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({ url: '/test', method: 'POST', data: {} })
    })

    expect(result.current.error).not.toBe(null)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe(null)
  })
})
