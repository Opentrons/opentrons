import { useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'

import { featureFlagsAtom } from '../atoms'

import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '../types'

interface UseApiCallResult<T> {
  data: T | null
  error: ApiErrorResponse | null
  isLoading: boolean
  clearError: () => void
  callApi: (config?: AxiosRequestConfig) => Promise<void>
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    value != null &&
    typeof value === 'object' &&
    'message' in value &&
    'error_type' in value &&
    typeof (value as Record<string, unknown>).message === 'string' &&
    typeof (value as Record<string, unknown>).error_type === 'string'
  )
}

export const useApiCall = <T>(): UseApiCallResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiErrorResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [featureFlags] = useAtom(featureFlagsAtom)

  const clearError = (): void => {
    setError(null)
  }

  const callApi = async (config?: AxiosRequestConfig): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const enableAnalytics = featureFlags.enableAnalytics ?? true
      const analyticsHeaders = {
        'x-enable-analytics': enableAnalytics.toString(),
      }

      const response = await axios.request<T>({
        ...config,
        headers: {
          ...config?.headers,
          ...analyticsHeaders,
        },
      })
      setData(response.data)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<unknown>
        const responseData = axiosError.response?.data
        if (isApiErrorResponse(responseData)) {
          setError(responseData)
        } else {
          setError({
            message: axiosError.message,
            error_type: 'network_error',
          })
        }
      } else {
        setError({
          message:
            err instanceof Error ? err.message : 'An unexpected error occurred',
          error_type: 'unknown',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, clearError, callApi }
}
