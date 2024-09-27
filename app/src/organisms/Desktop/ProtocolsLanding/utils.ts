import { FLEX_STANDARD_MODEL } from '@opentrons/shared-data'
import type { ProtocolAnalysisOutput, RobotType } from '@opentrons/shared-data'

type AnalysisStatus =
  | 'missing'
  | 'loading'
  | 'error'
  | 'complete'
  | 'stale'
  | 'parameterRequired'

export function getAnalysisStatus(
  isAnalyzing: boolean,
  analysis?: ProtocolAnalysisOutput | null
): AnalysisStatus {
  if (isAnalyzing) {
    return 'loading'
  }
  if (analysis == null || analysis === undefined) {
    return 'missing'
  }
  if (analysis.liquids == null || analysis.runTimeParameters == null) {
    return 'stale'
  }
  if (analysis.result === 'parameter-value-required') {
    return 'parameterRequired'
  }
  if (analysis.errors.length > 0) {
    return 'error'
  }
  return 'complete'
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

export function getisFlexProtocol(
  protocolAnalysis?: ProtocolAnalysisOutput | null
): boolean {
  if (protocolAnalysis?.robotType === FLEX_STANDARD_MODEL) {
    return true
  } else {
    return false
  }
}
