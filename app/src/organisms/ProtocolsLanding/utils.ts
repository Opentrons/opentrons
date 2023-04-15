import first from 'lodash/first'
import { OT3_STANDARD_MODEL } from '@opentrons/shared-data'
import type { ProtocolAnalysisOutput, RobotType } from '@opentrons/shared-data'

type AnalysisStatus = 'missing' | 'loading' | 'error' | 'complete'

/**
 * Get the analysis status based on whether or not the protocol is currently being analyzed
 * and the result of the analysis.
 *
 * @param isAnalyzing - A boolean indicating if the protocol is currently being analyzed.
 * @param analysis - The result of the protocol analysis, if available.
 * @returns The status of the analysis: 'loading' if the protocol is currently being analyzed,
 * 'error' if the analysis produced errors, 'complete' if the analysis was successful, or
 * 'missing' if no analysis has been performed.
 */
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

/**
 * Get the display name for the protocol based on the result of the analysis and the names of the
 * source files used to generate the protocol.
 *
 * @param protocolKey - The key used to identify the protocol.
 * @param srcFileNames - An array of the names of the source files used to generate the protocol.
 * @param analysis - The result of the protocol analysis, if available.
 * @returns The display name of the protocol.
 */
export function getProtocolDisplayName(
  protocolKey: string,
  srcFileNames: string[],
  analysis?: ProtocolAnalysisOutput | null
): string {
  return analysis?.metadata?.protocolName ?? first(srcFileNames) ?? protocolKey
}

/**
 * Get the display name for the robot type.
 *
 * @param robotType - The type of robot.
 * @returns The display name for the robot type: 'OT-2' or 'OT-3'.
 */
export function getRobotTypeDisplayName(
  robotType: RobotType | null
): 'OT-2' | 'OT-3' {
  if (robotType === OT3_STANDARD_MODEL) {
    return 'OT-3'
  } else {
    // defaults to OT-2 display name. may want to reconsider for protocols that fail analysis
    return 'OT-2'
  }
}

/**
 * Determine whether or not a protocol is for an OT-3 robot.
 *
 * @param protocolAnalysis - The result of the protocol analysis, if available.
 * @returns A boolean indicating whether or not the protocol is for an OT-3 robot.
 */
export function getIsOT3Protocol(
  protocolAnalysis?: ProtocolAnalysisOutput | null
): boolean {
  if (protocolAnalysis?.robotType === OT3_STANDARD_MODEL) {
    return true
  } else {
    return false
  }
}
