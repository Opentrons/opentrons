// @flow
import * as errorCreators from './errorCreators'
import type {RobotState, CommandCreator, CommandCreatorError, PipetteLabwareFields} from './'

import updateLiquidState from './dispenseUpdateLiquidState'

export const SOURCE_WELL_BLOWOUT_DESTINATION: 'source_well' = 'source_well'
export const DEST_WELL_BLOWOUT_DESTINATION: 'dest_well' = 'dest_well'

export const blowoutUtil = (
  pipette,
  sourceLabware,
  sourceWell,
  destLabware,
  destWell,
  blowoutDestination,
) => {
  if (blowoutDestination) return []
  let labware = blowoutDestination
  let well = 'A1'

  // TODO Ian 2018-05-04 more explicit test for non-trash blowout destination
  if (blowoutDestination === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labware = sourceLabware
    well = sourceWell
  } else if (blowoutDestination === DEST_WELL_BLOWOUT_DESTINATION) {
    labware = destLabware
    well = destWell
  }
  return [blowout({pipette: pipette, labware, well})]
}

const blowout = (args: PipetteLabwareFields): CommandCreator => (prevRobotState: RobotState) => {
  /** Blowout with given args. Requires tip. */
  const {pipette, labware, well} = args

  const actionName = 'blowout'
  let errors: Array<CommandCreatorError> = []

  const pipetteData = prevRobotState.instruments[pipette]

  // TODO Ian 2018-04-30 this logic using command creator args + robotstate to push errors
  // is duplicated across several command creators (eg aspirate & blowout overlap).
  // You can probably make higher-level error creator util fns to be more DRY
  if (!pipetteData) {
    errors.push(errorCreators.pipetteDoesNotExist({actionName, pipette}))
  }

  if (!prevRobotState.tipState.pipettes[pipette]) {
    errors.push(errorCreators.noTipOnPipette({actionName, pipette, labware, well}))
  }

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(errorCreators.labwareDoesNotExist({actionName, labware}))
  }

  if (errors.length > 0) {
    return {errors}
  }

  const commands = [{
    command: 'blowout',
    params: {
      pipette,
      labware,
      well,
    },
  }]

  return {
    commands,
    robotState: {
      ...prevRobotState,
      liquidState: updateLiquidState({
        pipetteId: pipette,
        pipetteData,
        labwareId: labware,
        labwareType: prevRobotState.labware[labware].type,
        useFullVolume: true,
        well,
      }, prevRobotState.liquidState),
    },
  }
}

export default blowout
