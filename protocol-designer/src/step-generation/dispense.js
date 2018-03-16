// @flow
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {computeWellAccess} from '@opentrons/labware-definitions'
import {splitLiquid, mergeLiquid} from './utils'
import type {RobotState, CommandCreator, AspirateDispenseArgs, PipetteData} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>
export function _updateLiquidState (
  args: {
    pipetteId: string,
    pipetteData: PipetteData,
    volume: number,
    labwareId: string,
    labwareType: string,
    well: string
  },
  prevLiquidState: LiquidState
): LiquidState {
  const {pipetteId, pipetteData, volume, labwareId, labwareType, well} = args
  type Ingreds = {[ingredId: string]: {volume: number}} // TODO import a type
  type SourceAndDest = {|source: Ingreds, dest: Ingreds|}

  // remove liquid from pipette tips,
  // create intermediate object where sources are updated tip liquid states
  // and dests are "droplets" that need to be merged to dest well contents
  const splitLiquidStates: {[tipId: string]: SourceAndDest} = mapValues(
    prevLiquidState.pipettes[pipetteId],
    (prevTipLiquidState: {[ingredId: string]: {volume: number}}) =>
      splitLiquid(
        volume,
        prevTipLiquidState
      )
  )

  const wellsForTips = (pipetteData.channels === 1)
    ? [well]
    : computeWellAccess(labwareType, well)

  // TODO Ian 2018-03-16: duplicated in aspirate.js
  if (!wellsForTips) {
    throw new Error(pipetteData.channels === 1
      ? `Invalid well: ${well}`
      : `Labware id "${labwareId}", type ${labwareType}, well ${well} is not accessible by 8-channel's 1st tip`
    )
  }
  // TODO Also duplicated:
  const allWellsShared = wellsForTips.every(w => w && w === wellsForTips[0])

  // add liquid to well(s)
  const labwareLiquidState = allWellsShared
  // merge all liquid into the single well
  ? {[well]: reduce(
    splitLiquidStates,
    (wellLiquidStateAcc, splitLiquidStateForTip: {|source: Ingreds, dest: Ingreds|}) =>
    mergeLiquid(
      wellLiquidStateAcc,
      splitLiquidStateForTip.dest
    ),
    cloneDeep(prevLiquidState.labware[labwareId][well])
  )}
  // merge each tip's liquid into that tip's respective well
  : wellsForTips.reduce((acc, wellForTip, tipIdx) => {
    return {
      ...acc,
      [wellForTip]: mergeLiquid(
        splitLiquidStates[`${tipIdx}`].dest,
        prevLiquidState.labware[labwareId][wellForTip]
      )
    }
  }, {})

  return {
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipetteId]: mapValues(splitLiquidStates, 'source')
    },
    labware: {
      ...prevLiquidState.labware,
      [labwareId]: {
        ...prevLiquidState.labware[labwareId],
        ...labwareLiquidState
      }
    }
  }
}

// TODO Ian 2018-02-12 dispense is almost identical to aspirate, what will change? Should they share code?
const dispense = (args: AspirateDispenseArgs): CommandCreator => (prevRobotState: RobotState) => {
  /** Dispense with given args. Requires tip. */
  const {pipette, volume, labware, well} = args

  if (prevRobotState.tipState.pipettes[pipette] === false) {
    throw new Error(`Attempted to dispense with no tip on pipette: ${volume} uL with ${pipette} from ${labware}'s well ${well}`)
  }

  const commands = [{
    command: 'dispense',
    pipette,
    volume,
    labware,
    well
  }]

  return {
    commands,
    robotState: prevRobotState // TODO LATER deep clone robotState and manipulate it for liquid tracking here?
  }
}

export default dispense
