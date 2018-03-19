// @flow
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {computeWellAccess} from '@opentrons/labware-definitions'
import {splitLiquid, mergeLiquid} from './utils'
import type {RobotState, PipetteData} from './'

type LiquidState = $PropertyType<RobotState, 'liquidState'>
type LocationLiquidState = {[ingredId: string]: {volume: number}}

export default function updateLiquidState (
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
  type Ingreds = LocationLiquidState
  type SourceAndDest = {|source: Ingreds, dest: Ingreds|}

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

  const wellsForTips = (pipetteData.channels === 1)
    ? [well]
    : computeWellAccess(labwareType, well)

  // TODO Ian 2018-03-16: duplicated in aspirate.js. Candidate for a util
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
