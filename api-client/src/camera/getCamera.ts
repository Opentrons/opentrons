import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CameraData, CameraMeta } from './types'

export interface CameraResponse {
  data: CameraData[],
  meta: CameraMeta
}


export function GetCamera(
  config: HostConfig
): ResponsePromise<CameraResponse> {
  return request<CameraResponse>(GET, `/camera`, null, config)
}

