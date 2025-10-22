import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ImageFileDataResponse } from './types'

export function getImageFile(
  config: HostConfig,
  runId: string
): ResponsePromise<ImageFileDataResponse> {
  return request<ImageFileDataResponse>(
    GET,
    `/dataFiles/${runId}/images`,
    null,
    config
  )
}
