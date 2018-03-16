// @flow
// import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import {splitLiquid, mergeLiquid} from './utils'
import type {RobotState, CommandCreator, AspirateDispenseArgs} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>
export function _updateLiquidState (
  args: AspirateDispenseArgs,
  prevLiquidState: LiquidState
): LiquidState {
  const {pipette, volume, labware, well} = args
  // remove liquid from pipette
  console.log(prevLiquidState.pipettes)
  // : {[ingredId: string]: {volume: number}}) TODO
  const pipetteLiquidState = mapValues(
    prevLiquidState.pipettes[pipette],
    (prevTipLiquidState: {[ingredId: string]: {volume: number}}) =>
      ({volume: 444})
      // splitLiquid(
      //   volume,
      //   prevLiquidState
      // ).source
  )

  // add liquid to well(s)
  const labwareLiquidState = {}

  return {
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipette]: pipetteLiquidState
    },
    labware: {
      ...prevLiquidState.labware,
      [labware]: labwareLiquidState
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
