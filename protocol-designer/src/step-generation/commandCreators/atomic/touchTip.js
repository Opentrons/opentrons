// @flow
// import cloneDeep from 'lodash/cloneDeep'
import { noTipOnPipette, pipetteDoesNotExist } from '../../errorCreators'
import type {
  InvariantContext,
  RobotState,
  CommandCreator,
  CommandCreatorError,
} from '../../types'
import type { TouchTipArgsV3 } from '@opentrons/shared-data'

const touchTip = (args: TouchTipArgsV3): CommandCreator => (
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  /** touchTip with given args. Requires tip. */
  const actionName = 'touchTip'
  const { pipette, labware, well, offsetFromBottomMm } = args

  const pipetteData = prevRobotState.pipettes[pipette]

  let errors: Array<CommandCreatorError> = []

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
    robotState: prevRobotState,
  }
}

export default touchTip
