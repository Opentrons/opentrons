import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { UploadedCsvFilesResponse } from '../dataFiles/types'

export function getCsvFiles(
  config: HostConfig,
  protocolId: string
): ResponsePromise<UploadedCsvFilesResponse> {
  return request<UploadedCsvFilesResponse>(
    GET,
    `/protocols/${protocolId}/dataFiles`,
    null,
    config
  )
}
