import type {
  PickUpTipRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'

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
