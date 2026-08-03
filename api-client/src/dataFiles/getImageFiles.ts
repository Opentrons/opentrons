import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { ImageFilesDataResponse } from './types'

export function getImageFiles(
  config: HostConfig,
  runId: string
): ResponsePromise<ImageFilesDataResponse> {
  return request<ImageFilesDataResponse>(
    GET,
    `/dataFiles/${runId}/images`,
    config
  )
}
