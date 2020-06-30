// @flow
import type { TouchTipParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import { noTipOnPipette, pipetteDoesNotExist } from '../../errorCreators'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const touchTip: CommandCreator<TouchTipParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  /** touchTip with given args. Requires tip. */
  const actionName = 'touchTip'
  const { pipette, labware, well, offsetFromBottomMm } = args

  const pipetteData = prevRobotState.pipettes[pipette]

  const errors: Array<CommandCreatorError> = []

  if (!pipetteData) {
    errors.push(pipetteDoesNotExist({ actionName, pipette }))
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(noTipOnPipette({ actionName, pipette, labware, well }))
  }

  if (errors.length > 0) {
    return { errors }
  }

  const commands = [
    {
      command: 'touchTip',
      params: {
        pipette,
        labware,
        well,
        offsetFromBottomMm,
      },
    },
  ]

  return {
    commands,
  }
}
