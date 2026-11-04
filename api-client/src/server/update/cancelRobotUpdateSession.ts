import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CancelRobotUpdateSessionData } from './types'

export function cancelRobotUpdateSession(
  config: HostConfig,
  pathPrefix: string,
  userNotes?: string
): ResponsePromise<CancelRobotUpdateSessionData> {
  return request<CancelRobotUpdateSessionData>(
    POST,
    `${pathPrefix}/cancel`,
    config,
    { userNotes }
  )
}
