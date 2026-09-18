import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CameraResponse } from './types'

export function getCamera(config: HostConfig): ResponsePromise<CameraResponse> {
  return request<CameraResponse>(GET, `/camera`, config)
}
