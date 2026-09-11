import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RunDataFileMetadataResponse } from './types'

export function getRunDataFileMetadata(
  config: HostConfig,
  runId: string
): ResponsePromise<RunDataFileMetadataResponse> {
  return request<RunDataFileMetadataResponse>(
    GET,
    `/dataFiles/${runId}/all`,
    config
  )
}
