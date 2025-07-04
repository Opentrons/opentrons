import { useState } from 'react'
import axios from 'axios'
import { useAtom } from 'jotai'

import type { AxiosRequestConfig } from 'axios'
import { featureFlagsAtom } from '../atoms'

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
      setError(err.message as string)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, callApi }
}
