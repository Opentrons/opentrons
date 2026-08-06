import { getRobotUpdateSessionStatus } from '@opentrons/api-client'

import { robotUpdateStatus } from '/app/redux/robot-update'

import { STATUS_POLL_MS } from './constants'

import type {
  HostConfig,
  RobotUpdateSessionStatus,
} from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

/**
 * Poll update-server status until `isDone` is true.
 */
export function pollRobotUpdateStatus(
  hostConfig: HostConfig,
  pathPrefix: string,
  token: string,
  dispatch: Dispatch,
  isDone: (status: RobotUpdateSessionStatus) => boolean,
  signal?: AbortSignal
): Promise<RobotUpdateSessionStatus> {
  return new Promise((resolve, reject) => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const cleanup = (): void => {
      cancelled = true
      if (timeoutId != null) clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
    }

    const onAbort = (): void => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    const tick = (): void => {
      if (cancelled || signal?.aborted) {
        onAbort()
        return
      }

      getRobotUpdateSessionStatus(hostConfig, pathPrefix, token)
        .then(response => {
          if (cancelled) return
          const status = response.data
          dispatch(
            robotUpdateStatus(
              status.stage,
              status.message,
              status.progress != null ? Math.round(status.progress * 100) : null
            )
          )

          if (status.stage === 'error') {
            cleanup()
            reject(new Error(status.message || 'Update session error'))
            return
          }

          if (isDone(status)) {
            cleanup()
            resolve(status)
            return
          }

          timeoutId = setTimeout(tick, STATUS_POLL_MS)
        })
        .catch((error: unknown) => {
          if (cancelled) return
          cleanup()
          reject(error instanceof Error ? error : new Error(String(error)))
        })
    }

    tick()
  })
}
