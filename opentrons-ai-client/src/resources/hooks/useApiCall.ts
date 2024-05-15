import { useState } from 'react'
import axios from 'axios'

import type { AxiosRequestConfig } from 'axios'

interface UseApiCallResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  fetchData: (config: AxiosRequestConfig) => Promise<void>
}

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
        withCredentials: true,
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
