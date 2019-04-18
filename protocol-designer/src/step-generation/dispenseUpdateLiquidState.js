// @flow
import assert from 'assert'
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'
import {
  splitLiquid,
  mergeLiquid,
  getWellsForTips,
  getLocationTotalVolume,
} from './utils'
import type {
  InvariantContext,
  RobotState,
  LocationLiquidState,
  SourceAndDest,
} from './types'

type LiquidState = $PropertyType<RobotState, 'liquidState'>

export default function updateLiquidState(
  args: {
    invariantContext: InvariantContext,
    pipetteId: string,
    volume?: number,
    useFullVolume?: boolean,
    labwareId: string,
    well: string,
  },
  prevLiquidState: LiquidState
): LiquidState {
  // TODO: Ian 2018-06-14 return same shape as aspirateUpdateLiquidState fn: {liquidState, warnings}.
  const {
    invariantContext,
    pipetteId,
    volume,
    useFullVolume,
    labwareId,
    well,
  } = args
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const labwareDef = invariantContext.labwareEntities[labwareId].def
  assert(
    !(useFullVolume && typeof volume === 'number'),
    'dispenseUpdateLiquidState takes either `volume` or `useFullVolume`, but got both'
  )
  assert(
    typeof volume === 'number' || useFullVolume,
    'in dispenseUpdateLiquidState, either volume or useFullVolume are required'
  )

  const { wellsForTips, allWellsShared } = getWellsForTips(
    pipetteSpec.channels,
    labwareDef,
    well
  )

  // remove liquid from pipette tips,
  // create intermediate object where sources are updated tip liquid states
  // and dests are "droplets" that need to be merged to dest well contents
  const splitLiquidStates: { [tipId: string]: SourceAndDest } = mapValues(
    prevLiquidState.pipettes[pipetteId],
    (prevTipLiquidState: LocationLiquidState): SourceAndDest => {
      if (useFullVolume) {
        const totalTipVolume = getLocationTotalVolume(prevTipLiquidState)
        return totalTipVolume > 0
          ? splitLiquid(totalTipVolume, prevTipLiquidState)
          : { source: {}, dest: {} }
      }
      return splitLiquid(volume || 0, prevTipLiquidState)
    }
  )

  // add liquid to well(s)
  const labwareLiquidState = allWellsShared
    ? // merge all liquid into the single well
      {
        [well]: reduce(
          splitLiquidStates,
          (wellLiquidStateAcc, splitLiquidStateForTip: SourceAndDest) => {
            const res = mergeLiquid(
              wellLiquidStateAcc,
              splitLiquidStateForTip.dest
            )
            return res
          },
          cloneDeep(prevLiquidState.labware[labwareId][well])
        ),
      }
    : // merge each tip's liquid into that tip's respective well
      wellsForTips.reduce((acc, wellForTip, tipIdx) => {
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
