import type { RunCommandSummary } from '@opentrons/api-client'
import type { RunTimeCommand } from '@opentrons/shared-data'

export function isInterventionCommand(
  command: RunTimeCommand | RunCommandSummary
): boolean {
  return (
    command.commandType === 'pause' ||
    command.commandType === 'waitForResume' ||
    (command.commandType === 'moveLabware' &&
      command.params.strategy === 'manualMoveWithPause') ||
    command.commandType === 'flexStacker/empty' ||
    command.commandType === 'flexStacker/fill'
  )
}
