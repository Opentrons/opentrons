import { getRobotUpdateSessionStatus } from '@opentrons/api-client'

import { robotUpdateStatus } from '/app/redux/robot-update'

import { STATUS_POLL_MS } from './constants'

import type {
  HostConfig,
  RobotUpdateSessionStatus,
} from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

// Used when auto-commit has likely rebooted before we observed a status.
export const UNREACHABLE_SESSION_STATUS: RobotUpdateSessionStatus = {
  stage: 'done',
  progress: null,
  message: '',
}

export interface PollRobotUpdateStatusParams {
  hostConfig: HostConfig
  pathPrefix: string
  token: string
  dispatch: Dispatch
  isDone: (status: RobotUpdateSessionStatus) => boolean
  // Cancels polling (ex, user starts another update). Rejects with AbortError.
  signal: AbortSignal
  // When true, a failed status GET completes the poll instead of rejecting.
  // Needed after auto-commit reboot since /status never succeeds, and
  // treating that as an error would fail an otherwise successful update.
  completeOnRequestError: boolean
}

/**
 * Poll update-server status until `isDone` is true.
 */
export function pollRobotUpdateStatus({
  hostConfig,
  pathPrefix,
  token,
  dispatch,
  isDone,
  signal,
  completeOnRequestError,
}: PollRobotUpdateStatusParams): Promise<RobotUpdateSessionStatus> {
  return new Promise((resolve, reject) => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastStatus: RobotUpdateSessionStatus | null = null

    const cleanup = (): void => {
      cancelled = true
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
      signal.removeEventListener('abort', onAbort)
    }

    const onAbort = (): void => {
      cleanup()
      reject(new DOMException('Aborted', 'AbortError'))
    }

    signal.addEventListener('abort', onAbort, { once: true })

    const tick = (): void => {
      if (cancelled || signal.aborted) {
        onAbort()
        return
      }

      getRobotUpdateSessionStatus(hostConfig, pathPrefix, token)
        .then(response => {
          if (cancelled) {
            return
          }
          const status = response.data
          lastStatus = status
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
          if (cancelled) {
            return
          }

          if (completeOnRequestError) {
            cleanup()
            resolve(lastStatus ?? UNREACHABLE_SESSION_STATUS)
            return
          }

          cleanup()
          reject(error instanceof Error ? error : new Error(String(error)))
        })
    }

    tick()
  })
}
