// @flow
import getNextRobotStateAndWarnings from '../../getNextRobotStateAndWarnings'
import * as errorCreators from '../../errorCreators'
import {getPipetteWithTipMaxVol} from '../../robotStateSelectors'
import type {RobotState, CommandCreator, CommandCreatorError, AspirateDispenseArgs} from '../../types'

/** Aspirate with given args. Requires tip. */
const aspirate = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  const {pipette, volume, labware, well, offsetFromBottomMm} = args
  const flowRateUlSec = args['flow-rate']

  const actionName = 'aspirate'
  let errors: Array<CommandCreatorError> = []

  const pipetteData: ?* = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    errors.push(errorCreators.pipetteDoesNotExist({actionName, pipette}))
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(errorCreators.noTipOnPipette({actionName, pipette, volume, labware, well}))
  }

  if (pipetteData && pipetteData.maxVolume < volume && errors.length === 0) {
    errors.push(errorCreators.pipetteVolumeExceeded({actionName, volume, maxVolume: pipetteData.maxVolume}))
  }

  const tipMaxVolume = getPipetteWithTipMaxVol(pipette, prevRobotState)
  if (tipMaxVolume < volume && errors.length === 0) {
    errors.push(errorCreators.tipVolumeExceeded({actionName, volume, maxVolume: tipMaxVolume}))
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({actionName, labware}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'aspirate',
    params: {
      pipette,
      volume,
      labware,
      well,
      offsetFromBottomMm: offsetFromBottomMm == null
        ? undefined
        : offsetFromBottomMm,
      'flow-rate': flowRateUlSec == null
        ? undefined
        : flowRateUlSec,
    },
  }]

  return {
    commands,
    ...getNextRobotStateAndWarnings(commands[0], prevRobotState),
  }
}

export default aspirate
