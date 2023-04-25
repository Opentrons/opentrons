import { RunTimeCommand } from '@opentrons/shared-data'
import { RunCommandSummary } from '@opentrons/api-client'

export function isInterventionCommand(
  command: RunTimeCommand | RunCommandSummary
): boolean {
  const { commandType } = command
  return (
    commandType === 'pause' ||
    commandType === 'waitForResume' ||
    (commandType === 'moveLabware' &&
      command.params?.strategy === 'manualMoveWithPause')
  )
}
