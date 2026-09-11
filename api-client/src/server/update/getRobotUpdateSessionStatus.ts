import { GET, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type { RobotUpdateSessionStatus } from './types'

export function getRobotUpdateSessionStatus(
  config: HostConfig,
  pathPrefix: string,
  token: string
): ResponsePromise<RobotUpdateSessionStatus> {
  return request<RobotUpdateSessionStatus>(
    GET,
    `${pathPrefix}/${token}/status`,
    config
  )
}
