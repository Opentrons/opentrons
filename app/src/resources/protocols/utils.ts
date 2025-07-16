import type { RunCommandSummary } from '@opentrons/api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { StepCounts } from '/app/resources/protocols/hooks'

export function isGripperInCommands(commands: RunTimeCommand[]): boolean {
  return (
    commands.some(
      c =>
        c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
    ) ?? false
  )
}

// See useRunningStepCounts.
export function getRunningStepCountsFrom(
  analysisCommands: RunTimeCommand[],
  lastRunProtocolCommand: RunCommandSummary | null
): StepCounts {
  const lastRunAnalysisCommandIndex = analysisCommands.findIndex(
    c => c.key === lastRunProtocolCommand?.key
  )

  const currentStepNumberByAnalysis =
    lastRunAnalysisCommandIndex === -1 ? null : lastRunAnalysisCommandIndex + 1

  const hasRunDiverged =
    lastRunProtocolCommand?.key == null || currentStepNumberByAnalysis == null

  const totalStepCount = !hasRunDiverged ? analysisCommands.length : null

  return {
    currentStepNumber: currentStepNumberByAnalysis,
    totalStepCount,
    hasRunDiverged,
  }
}
