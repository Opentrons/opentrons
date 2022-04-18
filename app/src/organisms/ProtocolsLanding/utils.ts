import first from 'lodash/first'
import { ProtocolAnalysisFile } from '@opentrons/shared-data'

type AnalysisStatus = 'missing' | 'loading' | 'error' | 'complete'

export function getAnalysisStatus(
  isAnalyzing: boolean,
  analysis?: ProtocolAnalysisFile<{}>
): AnalysisStatus {
  if (isAnalyzing) {
    return 'loading'
  } else if (analysis != null) {
    return analysis.errors.length > 0 ? 'error' : 'complete'
  } else {
    return 'missing'
  }
}

export function getProtocolDisplayName(
  protocolKey: string,
  srcFileNames: string[],
  analysis?: ProtocolAnalysisFile<{}>
): string {
  return analysis?.metadata?.protocolName ?? first(srcFileNames) ?? protocolKey
}
