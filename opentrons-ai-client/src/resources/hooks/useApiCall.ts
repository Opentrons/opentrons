import { useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'

import { emailVerifiedAtom, featureFlagsAtom } from '../atoms'

import type { AxiosRequestConfig } from 'axios'

const EMAIL_NOT_VERIFIED_SUBSTRING = 'not been verified'

interface UseApiCallResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  callApi: (data: any, config?: AxiosRequestConfig) => Promise<void>
}

export const useApiCall = <T>(): UseApiCallResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [featureFlags] = useAtom(featureFlagsAtom)
  const [, setEmailVerified] = useAtom(emailVerifiedAtom)

  const callApi = async (config?: AxiosRequestConfig): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      // Add analytics header based on feature flags
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
    } catch (err: any) {
      const detail: unknown = err?.response?.data?.detail
      if (
        err?.response?.status === 401 &&
        typeof detail === 'string' &&
        detail.includes(EMAIL_NOT_VERIFIED_SUBSTRING)
      ) {
        setEmailVerified(false)
      }
      setError(err.message as string)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, callApi }
}
