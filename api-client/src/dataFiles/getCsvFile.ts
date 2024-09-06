import { GET, request } from '../request'

import type { CsvFileDataResponse } from './types'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getCsvFile(
  config: HostConfig,
  fileId: string
): ResponsePromise<CsvFileDataResponse> {
  return request<CsvFileDataResponse>(GET, `/dataFiles/${fileId}`, null, config)
}
