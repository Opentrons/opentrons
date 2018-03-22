// @flow
// import cloneDeep from 'lodash/cloneDeep'
import {computeWellAccess} from '@opentrons/labware-definitions'
import type {RobotState, CommandCreator, AspirateDispenseArgs} from './'
import updateLiquidState from './aspirateUpdateLiquidState'

const aspirate = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  /** Aspirate with given args. Requires tip. */
  const {pipette, volume, labware, well} = args

  const pipetteData = prevRobotState.instruments[pipette]

  if (!pipetteData) {
    throw new Error(`Attempted to aspirate with pipette id "${pipette}", this pipette was not found under "instruments"`)
  }

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to aspirate with no tip on pipette: ${volume} uL with ${pipette} from ${labware}'s well ${well}`)
  }

  if (pipetteData.maxVolume < volume) {
    throw new Error(`Attempted to aspirate volume greater than pipette max volume (${volume} > ${pipetteData.maxVolume})`)
  }

  const commands = [{
    command: 'aspirate',
    pipette,
    volume,
    labware,
    well
  }]

  const labwareType = prevRobotState.labware[labware].type

  const wellsForTips = (pipetteData.channels === 1)
    ? [well]
    : computeWellAccess(labwareType, well)

  if (!wellsForTips) {
    throw new Error(pipetteData.channels === 1
      ? `Invalid well: ${well}`
      : `Labware id "${labware}", type ${labwareType}, well ${well} is not accessible by 8-channel's 1st tip`
    )
  }

  const robotState = {
    ...prevRobotState,
    liquidState: updateLiquidState({
      pipetteId: pipette,
      pipetteData: prevRobotState.instruments[pipette],
      labwareId: labware,
      labwareType: prevRobotState.labware[labware].type,
      volume,
      well
    }, prevRobotState.liquidState)
  }

  return {
    commands,
    robotState
  }
}

export default aspirate
