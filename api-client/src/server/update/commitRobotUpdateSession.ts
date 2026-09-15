import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { CommitRobotUpdateSessionData } from './types'

export function commitRobotUpdateSession(
  config: HostConfig,
  pathPrefix: string,
  token: string,
  userNotes?: string
): ResponsePromise<CommitRobotUpdateSessionData> {
  return request<CommitRobotUpdateSessionData>(
    POST,
    `${pathPrefix}/${token}/commit`,
    config,
    { userNotes }
  )
}
