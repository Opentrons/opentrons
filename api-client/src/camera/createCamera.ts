import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CameraData, CameraMeta } from './types'

export interface CreateCameraResponse {
  data: CameraData[]
  meta: CameraMeta
}

export type CreateCameraData = CameraData

export function CreateCamera(
  config: HostConfig,
  data: CreateCameraData
): ResponsePromise<CreateCameraResponse> {
  return request<CreateCameraResponse, { data: CameraData }>(
    GET,
    `/camera`,
    { data },
    config
  )
}
