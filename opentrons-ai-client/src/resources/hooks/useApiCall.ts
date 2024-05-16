import { useState } from 'react'
import axios from 'axios'
import { isLocalhost } from '../utils/utils'

import type { AxiosRequestConfig } from 'axios'

interface UseApiCallResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  fetchData: (config: AxiosRequestConfig) => Promise<void>
}

/**
 * React hook to initiate an API call and track its progress and result.
 * @template T The type of the data returned by the API call.
 * @returns An object with the current state of the API call and a function to initiate the call.
 */
export const useApiCall = <T>(): UseApiCallResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const fetchData = async (config: AxiosRequestConfig): Promise<void> => {
    console.log('useApiCall - fetchData')
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.request<T>({
        ...config,
        withCredentials: isLocalhost(),
      })
      console.log(response)
      setData(response.data)
    } catch (err: any) {
      // ToDo (kk:05/15/2024) remove any
      console.log(err)
      setError(err.message as string)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, fetchData }
}
