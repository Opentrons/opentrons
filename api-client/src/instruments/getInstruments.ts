import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Instruments, GetInstrumentsRequestParams } from './types'

export function getInstruments(
  config: HostConfig,
  params: GetInstrumentsRequestParams = {}
): ResponsePromise<Instruments> {
  return request<Instruments>(GET, `/instruments`, null, config, params)
}
