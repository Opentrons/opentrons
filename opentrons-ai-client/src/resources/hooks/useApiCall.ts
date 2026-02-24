import { useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'

import { emailVerifiedAtom, featureFlagsAtom } from '../atoms'
import { isApiErrorResponse } from '../utils'

import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '../types'

const EMAIL_NOT_VERIFIED_SUBSTRING = 'not been verified'

interface UseApiCallResult<T> {
  data: T | null
  error: ApiErrorResponse | null
  isLoading: boolean
  clearError: () => void
  callApi: (config?: AxiosRequestConfig) => Promise<void>
}

export const useApiCall = <T>(): UseApiCallResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiErrorResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [featureFlags] = useAtom(featureFlagsAtom)
  const [, setEmailVerified] = useAtom(emailVerifiedAtom)

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
        const detail = (responseData as Record<string, unknown>)?.detail
        if (
          axiosError.response?.status === 401 &&
          typeof detail === 'string' &&
          detail.includes(EMAIL_NOT_VERIFIED_SUBSTRING)
        ) {
          setEmailVerified(false)
        }
        if (isApiErrorResponse(responseData)) {
          setError(responseData)
        } else {
          setError({
            message: axiosError.message,
            errorType: 'network_error',
          })
        }
      } else {
        setError({
          message:
            err instanceof Error ? err.message : 'An unexpected error occurred',
          errorType: 'unknown',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, clearError, callApi }
}
