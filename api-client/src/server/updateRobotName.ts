import { POST, request } from '../request'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UpdatedRobotName } from './types'

export function updateRobotName(
  config: HostConfig,
  newName: string
): ResponsePromise<UpdatedRobotName> {
  const newRobotName = JSON.stringify({ name: newName })
  return request<UpdatedRobotName, string>(POST, '/server/name', newRobotName, config)
}
