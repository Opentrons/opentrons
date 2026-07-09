import { GET, request } from '../request'

import type { RequestConfig, ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DownloadedRunResponse } from './types'

export function getRunRaw(
  config: HostConfig,
  runId: string,
  responseType?: RequestConfig<unknown>['responseType']
): ResponsePromise<DownloadedRunResponse> {
  return request<DownloadedRunResponse>(
    GET,
    `/runs/${runId}/download`,
    config,
    { responseType }
  )
}
