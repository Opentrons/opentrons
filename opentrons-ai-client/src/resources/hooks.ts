import { useEffect, useState } from 'react'
import axios from 'axios'

const url = 'https://mockgpt.wiremockapi.cloud/v1/chat/completions'

interface FetchResult {
  data: any
  loading: boolean
  error: string
  fetchData: (prompt: string) => Promise<void>
}

export const useFetch = (prompt: string): FetchResult => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const fetchData = async (prompt: string): Promise<void> => {
    if (prompt !== '') {
      setLoading(true)
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
  }

  useEffect(() => {
    void fetchData(prompt)
  }, [prompt])

  return { data, loading, error, fetchData }
}
