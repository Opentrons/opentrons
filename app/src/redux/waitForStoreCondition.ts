import type { Store } from 'redux'
import type { State } from './types'

export interface WaitForStoreOptions {
  signal?: AbortSignal
  /** If this returns a string, the waiter rejects with that message. */
  getError?: (state: State) => string | null
}

/**
 * Resolves when `select(state)` yields a value that passes `isReady`.
 * Rejects on abort, or when `getError` returns a message.
 */
export function waitForStoreCondition<T>(
  store: Store<State>,
  select: (state: State) => T | null | undefined,
  isReady: (value: T) => boolean,
  options: WaitForStoreOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false

    const settle = (fn: () => void): void => {
      if (settled) return
      settled = true
      unsubscribe()
      options.signal?.removeEventListener('abort', onAbort)
      fn()
    }

    const onAbort = (): void => {
      settle(() => {
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }

    const check = (): void => {
      if (options.signal?.aborted) {
        onAbort()
        return
      }

      const errorMessage = options.getError?.(store.getState()) ?? null
      if (errorMessage != null) {
        settle(() => {
          reject(new Error(errorMessage))
        })
        return
      }

      const value = select(store.getState())
      if (value != null && isReady(value)) {
        settle(() => {
          resolve(value)
        })
      }
    }

    const unsubscribe = store.subscribe(check)
    options.signal?.addEventListener('abort', onAbort, { once: true })
    check()
  })
}
