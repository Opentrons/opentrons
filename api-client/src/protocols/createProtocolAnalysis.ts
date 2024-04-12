import { POST, request } from '../request'

import type { ProtocolAnalysisSummary } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { RunTimeParameterCreateData } from '../runs'

interface CreateProtocolAnalysisData {
  runTimeParameterValues: RunTimeParameterCreateData
  forceReAnalyze: boolean
}

export function createProtocolAnalysis(
  config: HostConfig,
  protocolKey: string,
  runTimeParameterValues?: RunTimeParameterCreateData,
  forceReAnalyze?: boolean
): ResponsePromise<ProtocolAnalysisSummary[]> {
  const data = {
    runTimeParameterValues: runTimeParameterValues ?? {},
    forceReAnalyze: forceReAnalyze ?? false,
  }
  const response = request<
    ProtocolAnalysisSummary[],
    { data: CreateProtocolAnalysisData }
  >(POST, `/protocols/${protocolKey}/analyses`, { data }, config)
  return response
}
