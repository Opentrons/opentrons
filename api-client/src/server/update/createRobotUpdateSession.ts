import { POST, request } from '../../request'

import type { ResponsePromise } from '../../request'
import type { HostConfig } from '../../types'
import type {
  CreateRobotUpdateSessionData,
  CreateRobotUpdateSessionRequest,
} from './types'

export function createRobotUpdateSession(
  config: HostConfig,
  sessionPath: string,
  body: CreateRobotUpdateSessionRequest,
  userNotes?: string
): ResponsePromise<CreateRobotUpdateSessionData> {
  return request<CreateRobotUpdateSessionData, CreateRobotUpdateSessionRequest>(
    POST,
    sessionPath,
    config,
    { body, userNotes }
  )
}
