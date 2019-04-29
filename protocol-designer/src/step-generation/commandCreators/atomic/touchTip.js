// @flow
// import cloneDeep from 'lodash/cloneDeep'
import { noTipOnPipette, pipetteDoesNotExist } from '../../errorCreators'
import type {
  InvariantContext,
  RobotState,
  CommandCreator,
  CommandCreatorError,
  TouchTipArgs,
} from '../../types'

const touchTip = (args: TouchTipArgs): CommandCreator => (
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
      command: 'touch-tip',
      params: {
        pipette,
        labware,
        well,
        offsetFromBottomMm:
          offsetFromBottomMm == null ? undefined : offsetFromBottomMm,
      },
    },
  ]

  return {
    commands,
    robotState: prevRobotState,
  }
}

export default touchTip
