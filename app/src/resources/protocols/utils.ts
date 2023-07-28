import type { RunTimeCommand } from '@opentrons/shared-data'

export function isGripperInCommands(commands: RunTimeCommand[]): boolean {
  return (
    commands.some(
      c =>
        c.commandType === 'moveLabware' && c.params.strategy === 'usingGripper'
    ) ?? false
  )
}
