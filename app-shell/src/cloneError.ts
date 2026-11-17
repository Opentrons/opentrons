import axios from 'axios'

export function cloneError(e: unknown): Record<string, unknown> {
  if (axios.isAxiosError(e)) {
    const cloned: Record<string, unknown> = {
      isAxiosError: true,
      message: e.message,
      name: e.name,
    }
    if (e.code != null) {
      cloned.code = e.code
    }
    if (e.stack != null) {
      cloned.stack = e.stack
    }
    if (e.response != null) {
      cloned.status = e.response.status
      const response: Record<string, unknown> = {
        status: e.response.status,
        statusText: e.response.statusText,
      }
      try {
        response.data = structuredClone(e.response.data)
      } catch {
        // Omit data that cannot cross IPC (functions, some host objects).
      }
      cloned.response = response
    }

    return cloned
  } else if (typeof e === 'object' && e != null) {
    const cloned = cloneEnumerableOwnProperties(e)
    if (e instanceof Error) {
      cloned.message = e.message
      cloned.name = e.name
      if (e.stack != null) {
        cloned.stack = e.stack
      }
    }

    return cloned
  } else {
    return { message: String(e) }
  }

  function cloneEnumerableOwnProperties(e: object): Record<string, unknown> {
    return Object.entries(e).reduce<Record<string, unknown>>((acc, [k, v]) => {
      try {
        acc[k] = structuredClone(v)
        return acc
      } catch {
        return acc
      }
    }, {})
  }
}
