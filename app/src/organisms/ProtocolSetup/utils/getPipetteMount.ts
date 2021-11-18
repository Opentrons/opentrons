import type { Command } from '@opentrons/shared-data'
import type { LoadPipetteCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

export const getPipetteMount = (
  pipetteId: string,
  commands: Command[]
): 'left' | 'right' => {
  const mount = commands.find(
    (command: Command): command is LoadPipetteCommand =>
      command.commandType === 'loadPipette' &&
      command.result?.pipetteId === pipetteId
  )?.params.mount

  if (mount == null) {
    throw new Error('expected to be able to find pipette mount, but could not')
  }
  return mount
}
