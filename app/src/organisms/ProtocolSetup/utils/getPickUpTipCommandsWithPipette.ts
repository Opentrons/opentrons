import { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6'

export const getPickUpTipCommandsWithPipette = (
  commands: RunTimeCommand[],
  pipetteId: string
): PickUpTipRunTimeCommand[] =>
  commands
    .filter(
      (command): command is PickUpTipRunTimeCommand =>
        command.commandType === 'pickUpTip'
    )
    .filter(command => command.params.pipetteId === pipetteId)
