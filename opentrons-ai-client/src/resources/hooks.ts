import { useEffect, useState } from 'react'
import axios from 'axios'

interface FetchResult {
  data: any
  loading: boolean
  error: string
}

export const useFetch = (url: string, prompt: string): FetchResult => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const fetchData = async (): Promise<void> => {
    try {
      const response = await axios.post(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
        },
        data: {
          prompt,
        },
      })

      setData(response.data)
    } catch (err) {
      setError('Error fetching data from the API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [url])

  return { data, loading, error }
}
