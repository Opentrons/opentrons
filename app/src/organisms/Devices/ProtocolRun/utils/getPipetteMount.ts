import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'

export const getPipetteMount = (
  pipetteId: string,
  commands: RunTimeCommand[]
): 'left' | 'right' => {
  const mount = commands.find(
    (command: RunTimeCommand): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette' &&
      command.result?.pipetteId === pipetteId
  )?.params.mount

  if (mount == null) {
    throw new Error('expected to be able to find pipette mount, but could not')
  }
  return mount
}
