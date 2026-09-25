import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UpdateModuleResponse } from './types'

export function updateModule(
  config: HostConfig,
  serialNumber: string,
  userNotes: string
): ResponsePromise<UpdateModuleResponse> {
  return request<UpdateModuleResponse>(
    POST,
    `/modules/${serialNumber}/update`,
    config,
    { userNotes }
  )
}
