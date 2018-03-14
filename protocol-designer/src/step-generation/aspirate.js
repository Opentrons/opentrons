// @flow
// import cloneDeep from 'lodash/cloneDeep'
import {computeWellAccess} from '@opentrons/labware-definitions'
import range from 'lodash/range'
import type {RobotState, CommandCreator, AspirateDispenseArgs} from './'
import {splitLiquid} from './utils'

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

  // TODO unify this: for each tip, a well (except for trough :/ )
  const pipetteLiquidState = range(pipetteData.channels).reduce((acc, tipIndex) => ({
    ...acc,
    [tipIndex]: splitLiquid(
      volume / pipetteData.channels,
      prevRobotState.liquidState.labware[labware][wellsForTips[tipIndex]]
    ).dest
  }), {})

  const labwareLiquidState = {
    ...prevRobotState.liquidState.labware[labware],
    ...wellsForTips.reduce((acc, well) => ({
      ...acc,
      [well]: splitLiquid(
        volume,
        prevRobotState.liquidState.labware[labware][well]
      ).source
    }), {})
  }

  const robotState = {
    ...prevRobotState,
    liquidState: {
      pipettes: {
        ...prevRobotState.liquidState.pipettes,
        [pipette]: pipetteLiquidState
      },
      labware: {
        ...prevRobotState.liquidState.labware,
        [labware]: labwareLiquidState
      }
    }
  }

  return {
    commands,
    robotState
  }
}

export default aspirate
