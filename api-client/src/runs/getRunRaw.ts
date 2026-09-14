import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedRunResponse, GetRunDownloadParams } from './types'

export function getRunRaw(
  config: HostConfig,
  runId: string,
  params: GetRunDownloadParams = {},
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<DownloadedRunResponse> {
  return request<DownloadedRunResponse>(
    GET,
    `/runs/${runId}/download`,
    config,
    { queryParams: { ...params }, responseType }
  )
}
