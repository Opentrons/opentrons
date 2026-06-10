import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { DataFileDataResponse } from './types'

export function getDataFile(
  config: HostConfig,
  fileId: string
): ResponsePromise<DataFileDataResponse> {
  return request<DataFileDataResponse>(GET, `/dataFiles/${fileId}`, config)
}
