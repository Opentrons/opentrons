import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
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

  it('should handle post error', async () => {
    mock.onPost('/test').networkError()

    const { result } = renderHook(() => useApiCall())

    await act(async () => {
      await result.current.callApi({ url: '/test', method: 'POST', data: {} })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Network Error')
  })
})
