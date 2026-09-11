import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CameraData, CameraResponse } from './types'

export function createCamera(
  config: HostConfig,
  data: CameraData,
  userNotes: string
): ResponsePromise<CameraResponse> {
  return request<CameraResponse, { data: CameraData }>(
    POST,
    `/camera`,
    config,
    { body: { data }, userNotes }
  )
}
