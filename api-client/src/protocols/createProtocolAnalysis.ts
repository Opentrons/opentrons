import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Protocol } from './types'
import type { RunTimeParameterCreateData } from '../runs'

export function createProtocolAnalysis(
  config: HostConfig,
  protocolKey: string,
  runTimeParameterValues?: RunTimeParameterCreateData,
  forceReAnalyze?: boolean
): ResponsePromise<Protocol> {
  const data = {
    runTimeParameterValues: runTimeParameterValues ?? {},
    forceReAnalyze: forceReAnalyze ?? false,
  }
  return request<Protocol, Object>(
    POST,
    `/protocols/${protocolKey}/analyses`,
    { data },
    config
  )
}
