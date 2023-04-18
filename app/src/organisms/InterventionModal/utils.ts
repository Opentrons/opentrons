import { RunTimeCommand } from '@opentrons/shared-data'
import { RunCommandSummary } from '@opentrons/api-client'

export const INTERVENTION_COMMAND_TYPES = [
  'pause',
  'waitForResume',
  'moveLabware',
]

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
