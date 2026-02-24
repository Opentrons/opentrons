export interface StreamChatCallbacks {
  onDelta: (accumulated: string) => void
  onDone: (reply: string) => void
  onError: (error: Error) => void
}

const SSE_ACCEPT = 'text/event-stream'

function parseStreamError(status: number, bodyText: string): string {
  try {
    const json = JSON.parse(bodyText) as {
      detail?: string
      message?: string
      error_type?: string
      timeout_seconds?: number
    }
    const detail =
      typeof json.detail === 'string'
        ? json.detail
        : typeof json.message === 'string'
          ? json.message
          : null
    if (detail != null) {
      if (
        json.error_type === 'request_timeout' &&
        json.timeout_seconds != null
      ) {
        return `${detail} (${json.timeout_seconds}s timeout).`
      }
      return detail
    }
  } catch {
    // ignore
  }
  if (bodyText.length > 200) {
    return `HTTP ${status}: ${bodyText.slice(0, 200)}…`
  }
  return `HTTP ${status}: ${bodyText.length > 0 ? bodyText : 'No response body'}`
}

/**
 * Fetch any streaming chat API endpoint (SSE) and parse events.
 * Used for update-protocol, create-protocol, completion, and completion-multipart streams.
 * Supports JSON body or FormData (for multipart). For FormData, do not set Content-Type in headers.
 */
export async function streamChatApi(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    body: string | FormData
  },
  callbacks: StreamChatCallbacks
): Promise<void> {
  const { onDelta, onDone, onError } = callbacks
  let accumulated = ''

  try {
    const headers =
      options.body instanceof FormData
        ? (() => {
            const { 'Content-Type': _ct, ...rest } = options.headers
            return { ...rest, Accept: SSE_ACCEPT }
          })()
        : { ...options.headers, Accept: SSE_ACCEPT }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body,
    })

    if (!response.ok) {
      const text = await response.text()
      onError(new Error(parseStreamError(response.status, text)))
      return
    }

    const reader = response.body?.getReader()
    if (reader == null) {
      onError(new Error('No response body'))
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
    const friendlyMessage = isNetworkError
      ? `Cannot reach the API. Ensure the server is running at ${url} and CORS allows your origin (e.g. http://localhost:5173).`
      : message
    onError(new Error(friendlyMessage))
  }
}
