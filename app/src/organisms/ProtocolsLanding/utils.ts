import first from 'lodash/first'
import type { ProtocolAnalysisOutput, RobotType } from '@opentrons/shared-data'

import { ROBOT_MODEL_OT3 } from '../../redux/discovery'

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

// TODO(bh, 2022-12-12): replace when robotType added to ProtocolAnalysisOutput interface
export type ProtocolAnalysisOutputWithRobotType = ProtocolAnalysisOutput & {
  robotType?: RobotType
}
export function getIsOT3Protocol(
  protocolAnalysis?: ProtocolAnalysisOutputWithRobotType | null
): boolean {
  if (protocolAnalysis?.robotType === ROBOT_MODEL_OT3) {
    return true
  } else {
    return false
  }
}
