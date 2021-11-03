import { PickUpTipCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV6'

export const getPickUpTipCommandsWithPipette = (
  commands: Command[],
  pipetteId: string
): PickUpTipCommand[] => {
  return commands
    .filter(
      (command): command is PickUpTipCommand =>
        command.commandType === 'pickUpTip'
    )
    .filter(command => command.params.pipetteId === pipetteId)
}
