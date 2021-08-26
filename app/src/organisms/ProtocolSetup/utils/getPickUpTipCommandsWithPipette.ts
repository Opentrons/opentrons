import { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import { PickUpTipCommand } from '../LabwarePositionCheck/types'

export const getPickUpTipCommandsWithPipette = (
  commands: Command[],
  pipetteId: string
): PickUpTipCommand[] =>
  commands
    .filter(
      (command): command is PickUpTipCommand => command.command === 'pickUpTip'
    )
    .filter(command => command.params.pipette === pipetteId)
