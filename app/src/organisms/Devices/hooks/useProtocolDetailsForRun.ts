import { schemaV6Adapter } from '@opentrons/shared-data'
import { useProtocolForRun } from '.'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

export interface ProtocolDetails {
  displayName: string | null
  protocolData: ProtocolAnalysisFile<{}> | null
}

export function useProtocolDetailsForRun(
  runId: string | null
): ProtocolDetails {
  let protocolData: ProtocolAnalysisFile<{}> | null = null
  const protocolRecord = useProtocolForRun(runId)

  const protocolAnalysis = protocolRecord?.data.analyses
  if (protocolAnalysis != null) {
    const lastProtocolAnalysis = protocolAnalysis[protocolAnalysis.length - 1]
    if (lastProtocolAnalysis.status === 'completed') {
      protocolData = schemaV6Adapter(lastProtocolAnalysis)
    }
  }
  const displayName =
    protocolRecord?.data.metadata.protocolName ??
    protocolRecord?.data.files[0].name

  return { displayName: displayName ?? null, protocolData }
}
