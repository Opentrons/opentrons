import type { RunCommandSummary } from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '../'

// Return the next protocol step given the failedCommand, if any.
export function getNextStep(
  failedCommand: ErrorRecoveryFlowsProps['failedCommand'],
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
): RunCommandSummary | null {
  if (protocolAnalysis != null && failedCommand != null) {
    const failedCommandAnalysisIdx = protocolAnalysis.commands.findIndex(
      command => command.key === failedCommand.key
    )

    return failedCommandAnalysisIdx !== -1
      ? protocolAnalysis.commands[failedCommandAnalysisIdx + 1] ?? null
      : null
  } else {
    return null
  }
}
