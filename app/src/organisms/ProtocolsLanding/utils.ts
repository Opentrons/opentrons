import first from 'lodash/first'
import { FLEX_STANDARD_MODEL } from '@opentrons/shared-data'
import type { ProtocolAnalysisOutput, RobotType } from '@opentrons/shared-data'

type AnalysisStatus = 'missing' | 'loading' | 'error' | 'complete'

export function getAnalysisStatus(
  isAnalyzing: boolean,
  analysis?: ProtocolAnalysisOutput | null
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
  analysis?: ProtocolAnalysisOutput | null
): string {
  return analysis?.metadata?.protocolName ?? first(srcFileNames) ?? protocolKey
}

export function getRobotTypeDisplayName(
  robotType: RobotType | null
): 'OT-2' | 'Opentrons Flex' {
  if (robotType === FLEX_STANDARD_MODEL) {
    return 'Opentrons Flex'
  } else {
    // defaults to OT-2 display name. may want to reconsider for protocols that fail analysis
    return 'OT-2'
  }
}

export function getIsOT3Protocol(
  protocolAnalysis?: ProtocolAnalysisOutput | null
): boolean {
  if (protocolAnalysis?.robotType === FLEX_STANDARD_MODEL) {
    return true
  } else {
    return false
  }
}
