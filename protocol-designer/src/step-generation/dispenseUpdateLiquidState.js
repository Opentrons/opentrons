// @flow
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {splitLiquid, mergeLiquid, getWellsForTips} from './utils'
import type {RobotState, LocationLiquidState, PipetteData} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>

export default function updateLiquidState (
  args: {
    pipetteId: string,
    pipetteData: PipetteData,
    volume: number,
    labwareId: string,
    labwareType: string,
    well: string,
  },
  prevLiquidState: LiquidState
): LiquidState {
  // TODO: Ian 2018-06-14 return same shape as aspirateUpdateLiquidState fn: {liquidState, warnings}.
  const {pipetteId, pipetteData, volume, labwareId, labwareType, well} = args
  type SourceAndDest = {|source: LocationLiquidState, dest: LocationLiquidState|}

  // remove liquid from pipette tips,
  // create intermediate object where sources are updated tip liquid states
  // and dests are "droplets" that need to be merged to dest well contents
  const splitLiquidStates: {[tipId: string]: SourceAndDest} = mapValues(
    prevLiquidState.pipettes[pipetteId],
    (prevTipLiquidState: LocationLiquidState) =>
      splitLiquid(
        volume,
        prevTipLiquidState
      )
  )

  const {wellsForTips, allWellsShared} = getWellsForTips(pipetteData.channels, labwareType, well)

  // add liquid to well(s)
  const labwareLiquidState = allWellsShared
  // merge all liquid into the single well
  ? {[well]: reduce(
    splitLiquidStates,
    (wellLiquidStateAcc, splitLiquidStateForTip: SourceAndDest) =>
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
        prevLiquidState.labware[labwareId][wellForTip] || {} // TODO Ian 2018-04-02 use robotState selector. (Liquid state falls back to {} for empty well)
      ),
    }
  }, {})

  return {
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipetteId]: mapValues(splitLiquidStates, 'source'),
    },
    labware: {
      ...prevLiquidState.labware,
      [labwareId]: {
        ...prevLiquidState.labware[labwareId],
        ...labwareLiquidState,
      },
    },
  }
}
