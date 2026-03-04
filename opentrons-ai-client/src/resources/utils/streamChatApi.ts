import { isApiErrorResponse } from './isApiErrorResponse'
import { resolveErrorMessage } from './resolveErrorMessage'

import type { TFunction } from 'i18next'
import type { ApiErrorResponse } from '../types'

export interface StreamChatCallbacks {
  onDelta: (accumulated: string) => void
  onDone: (reply: string) => void
  onError: (error: Error) => void
}

const SSE_ACCEPT = 'text/event-stream'
const MAX_ERROR_TEXT_LENGTH = 200

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

function parseStreamErrorFallback(status: number, bodyText: string): string {
  if (bodyText.length > MAX_ERROR_TEXT_LENGTH) {
    return `HTTP ${status}: ${bodyText.slice(0, MAX_ERROR_TEXT_LENGTH)}…`
  }
  return `HTTP ${status}: ${bodyText.length > 0 ? bodyText : 'No response body'}`
}

function parseErrorBody(
  bodyText: string
): ApiErrorResponse | { message: string } | null {
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>
    const message =
      typeof parsed.message === 'string'
        ? parsed.message
        : typeof parsed.detail === 'string'
          ? parsed.detail
          : null
    if (message == null) return null
    const errorType =
      typeof parsed.error_type === 'string'
        ? parsed.error_type
        : typeof parsed.errorType === 'string'
          ? parsed.errorType
          : undefined
    if (errorType != null) {
      return { message, error_type: errorType } as ApiErrorResponse
    }
    return { message }
  } catch {
    return null
  }
}

/**
 * Fetch any streaming chat API endpoint (SSE) and parse events.
 * Used for update-protocol, create-protocol, completion, and completion-multipart streams.
 * Supports JSON body or FormData (for multipart). For FormData, do not set Content-Type in headers.
 * Uses `t` for localized error messages consistent with resolveErrorMessage / API error handling.
 */
export async function streamChatApi(
  url: string,
  options: {
    method: HttpMethod
    headers: Record<string, string>
    body: string | FormData
    t: TFunction
  },
  callbacks: StreamChatCallbacks
): Promise<void> {
  const { onDelta, onDone, onError } = callbacks
  const { t } = options
  let accumulated = ''

  try {
    const baseHeaders = options.headers ?? {}
    const headers =
      options.body instanceof FormData
        ? (() => {
            const { 'Content-Type': _ct, ...rest } = baseHeaders
            return { ...rest, Accept: SSE_ACCEPT }
          })()
        : { ...baseHeaders, Accept: SSE_ACCEPT }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body,
    })

    if (!response.ok) {
      const text = await response.text()
      const parsed = parseErrorBody(text)
      const message =
        parsed != null && isApiErrorResponse(parsed)
          ? (resolveErrorMessage(parsed, t) ?? parsed.message)
          : parsed != null && 'message' in parsed
            ? parsed.message
            : parseStreamErrorFallback(response.status, text)
      onError(new Error(message))
      return
    }

    const reader = response.body?.getReader()
    if (reader == null) {
      onError(new Error(t('error_generic')))
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6)
          if (payload === '[DONE]' || payload.trim() === '') continue
          try {
            const data = JSON.parse(payload) as {
              delta?: string
              done?: boolean
            }
            if (typeof data.delta === 'string') {
              accumulated += data.delta
              onDelta(accumulated)
            }
            if (data.done === true) {
              onDone(accumulated)
              return
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      try {
        const payload = buffer.slice(6)
        const data = JSON.parse(payload) as { delta?: string; done?: boolean }
        if (typeof data.delta === 'string') {
          accumulated += data.delta
          onDelta(accumulated)
        }
      } catch {
        // ignore
      }
    }
    onDone(accumulated)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const lower = message.toLowerCase()
    const isNetworkError =
      lower === 'failed to fetch' ||
      lower.includes('network error') ||
      lower.includes('networkerror') ||
      lower.includes('load failed') ||
      lower.includes('network request failed')
    const friendlyMessage = isNetworkError ? t('error_connection') : message
    onError(new Error(friendlyMessage))
  }
}
