import { act, renderHook } from '@testing-library/react'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { describe, expect, it } from 'vitest'

import { useApiCall } from '../useApiCall'

const mock = new MockAdapter(axios)

describe('useApiCall', () => {
  it('should post data successfully', async () => {
    const mockData = { message: 'Hello, World!' }
    mock.onPost('/test').reply(200, mockData)

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
    mock.onPost('/test').networkError()

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
    mock.onPost('/test').reply(400, {
      message: 'Your request is too large.',
      errorType: 'context_length_exceeded',
    })

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
    mock.onPost('/test').reply(504, {
      message: 'Your request timed out.',
      errorType: 'request_timeout',
    })

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
    mock.onPost('/test').networkError()

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
