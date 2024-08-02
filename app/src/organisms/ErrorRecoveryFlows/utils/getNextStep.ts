import type { RunCommandSummary } from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '../'

// Return the next protocol step given the failedCommand, if any.
export const getNextStep = (
  failedCommand: ErrorRecoveryFlowsProps['failedCommand'],
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
): RunCommandSummary | null =>
  getNextSteps(failedCommand, protocolAnalysis, 1)?.at(0) ?? null

export function getNextSteps(
  failedCommand: ErrorRecoveryFlowsProps['failedCommand'],
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis'],
  atMostFurther: number
): RunCommandSummary[] | null {
  if (protocolAnalysis != null && failedCommand != null) {
    const failedCommandAnalysisIdx =
      protocolAnalysis?.commands?.findIndex(
        command => command.key === failedCommand.key
      ) ?? -1

    return failedCommandAnalysisIdx !== -1 &&
      failedCommandAnalysisIdx !== protocolAnalysis.commands.length - 1
      ? protocolAnalysis.commands.slice(
          failedCommandAnalysisIdx + 1,
          Math.min(
            failedCommandAnalysisIdx + 1 + atMostFurther,
            protocolAnalysis.commands.length
          )
        )
      : null
  } else {
    return null
  }
}
