import type { PickUpTipRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/pipetting'
import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7'

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
