import { useState } from 'react'
import { useAtom } from 'jotai'

import { HttpClientError, isHttpClientError } from '@opentrons/api-client'

import { emailVerifiedAtom, featureFlagsAtom } from '../atoms'
import { isApiErrorResponse } from '../utils'

import type { HttpRequestConfig } from '@opentrons/api-client'
import type { ApiErrorResponse } from '../types'

const EMAIL_NOT_VERIFIED_SUBSTRING = 'not been verified'

interface UseApiCallResult<T> {
  data: T | null
  error: ApiErrorResponse | null
  isLoading: boolean
  clearError: () => void
  callApi: (config?: HttpRequestConfig) => Promise<void>
}

const shouldEncodeJsonBody = (data: unknown): boolean =>
  data != null &&
  !(data instanceof FormData) &&
  !(data instanceof URLSearchParams) &&
  !(data instanceof Blob) &&
  typeof data !== 'string' &&
  !(data instanceof ArrayBuffer)

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (
    contentType.includes('application/json') ||
    contentType.includes('+json')
  ) {
    return await response.json()
  }

  return await response.text()
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

  const callApi = async (config?: HttpRequestConfig): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const enableAnalytics = featureFlags.enableAnalytics ?? true
      const analyticsHeaders = {
        'x-enable-analytics': enableAnalytics.toString(),
      }

      const requestConfig = {
        ...config,
        headers: {
          ...config?.headers,
          ...analyticsHeaders,
        },
      }
      const headers =
        shouldEncodeJsonBody(requestConfig.data) &&
        requestConfig.headers?.['Content-Type'] == null &&
        requestConfig.headers?.['content-type'] == null
          ? {
              ...requestConfig.headers,
              'Content-Type': 'application/json',
            }
          : requestConfig.headers
      const body = shouldEncodeJsonBody(requestConfig.data)
        ? JSON.stringify(requestConfig.data)
        : requestConfig.data
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers,
        body: body as BodyInit | null | undefined,
      })
      const responseData = (await parseResponseBody(response)) as T

      if (!response.ok) {
        throw new HttpClientError({
          message: `Request failed with status code ${response.status}`,
          config: requestConfig,
          response: {
            config: requestConfig,
            data: responseData,
            headers: Object.fromEntries(response.headers.entries()),
            status: response.status,
            statusText: response.statusText,
          },
        })
      }

      setData(responseData)
    } catch (err: unknown) {
      if (isHttpClientError(err)) {
        const responseData = err.response?.data
        const detail = (responseData as Record<string, unknown>)?.detail
        if (
          err.response?.status === 401 &&
          typeof detail === 'string' &&
          detail.includes(EMAIL_NOT_VERIFIED_SUBSTRING)
        ) {
          setEmailVerified(false)
        }
        if (isApiErrorResponse(responseData)) {
          setError(responseData)
        } else {
          setError({
            message: err.message,
            errorType: 'network_error',
          })
        }
      } else {
        setError({
          message:
            err instanceof Error ? err.message : 'An unexpected error occurred',
          errorType: err instanceof Error ? 'network_error' : 'unknown',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return { data, error, isLoading, clearError, callApi }
}
