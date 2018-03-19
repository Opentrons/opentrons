// @flow
// import cloneDeep from 'lodash/cloneDeep'
import {computeWellAccess} from '@opentrons/labware-definitions'
import range from 'lodash/range'
import type {RobotState, CommandCreator, AspirateDispenseArgs} from './'
import {mergeLiquid, splitLiquid} from './utils'

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

  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])
  // allWellsShared: eg in a trough, all wells are shared by an 8-channel
  // (for single-channel, "all wells" are always shared because there is only 1 well)
  // NOTE Ian 2018-03-15: there is no support for a case where some but not all wells are shared.
  // Eg, some unusual labware that allows 2 tips to a well will not work with the implementation below.
  // Low-priority TODO.

  // Blend tip's liquid contents (if any) with liquid of the source
  // to update liquid state in all pipette tips
  // TODO Ian 2018-03-19 factor this out, like dispenseUpdateLiquidState is
  const pipetteLiquidState = range(pipetteData.channels).reduce((acc, tipIndex) => {
    const prevTipLiquidState = prevRobotState.liquidState.pipettes[pipette][tipIndex.toString()]
    const prevSourceLiquidState = prevRobotState.liquidState.labware[labware][wellsForTips[tipIndex]]

    const newLiquidFromWell = splitLiquid(
      allWellsShared ? volume / pipetteData.channels : volume, // divide source volume across shared tips
      prevSourceLiquidState
    ).dest

    return {
      ...acc,
      [tipIndex]: mergeLiquid(
        prevTipLiquidState,
        newLiquidFromWell
      )
    }
  }, {})

  // Remove liquid from source well(s)
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
