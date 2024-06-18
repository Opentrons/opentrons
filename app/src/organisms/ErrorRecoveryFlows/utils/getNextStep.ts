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

    const nextCommand = protocolAnalysis.commands[failedCommandAnalysisIdx + 1]

    // Ensure the next command actually exists.
    return nextCommand ?? null
  } else {
    return null
  }
}
