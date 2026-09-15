import { GET, request } from '../request'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function getProtocolAnalysisAsDocument(
  config: HostConfig,
  protocolId: string,
  analysisId: string
): ResponsePromise<CompletedProtocolAnalysis> {
  return request<CompletedProtocolAnalysis>(
    GET,
    `/protocols/${protocolId}/analyses/${analysisId}/asDocument`,
    config
  )
}
