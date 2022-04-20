import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UpdatedRobotName } from './types'

export function updateRobotName(
  config: HostConfig,
  newName: string
): ResponsePromise<UpdatedRobotName> {
  return request<UpdatedRobotName, string>(
    POST,
    '/server/name',
    newName,
    config
  )
}
