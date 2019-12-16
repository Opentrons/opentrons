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
} from '../utils/misc'
import type {
  RobotState,
  InvariantContext,
  LocationLiquidState,
  SourceAndDest,
} from '../types'

type LiquidState = $PropertyType<RobotState, 'liquidState'>
type DispenseUpdateLiquidStateArgs = {|
  invariantContext: InvariantContext,
  prevLiquidState: LiquidState,
  labware: string,
  pipette: string,
  well: string,
  volume?: number, // volume value is required when useFullVolume is false
  useFullVolume: boolean,
|}

/** This is a helper to do dispense/blowout liquid state updates. */
export function dispenseUpdateLiquidState(
  args: DispenseUpdateLiquidStateArgs
): LiquidState {
  const {
    invariantContext,
    labware,
    pipette,
    prevLiquidState,
    useFullVolume,
    volume,
    well,
  } = args
  const pipetteSpec = invariantContext.pipetteEntities[pipette].spec
  const labwareDef = invariantContext.labwareEntities[labware].def

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
    prevLiquidState.pipettes[pipette],
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
          cloneDeep(prevLiquidState.labware[labware][well])
        ),
      }
    : // merge each tip's liquid into that tip's respective well
      wellsForTips.reduce((acc, wellForTip, tipIdx) => {
        return {
          ...acc,
          [wellForTip]: mergeLiquid(
            splitLiquidStates[`${tipIdx}`].dest,
            prevLiquidState.labware[labware][wellForTip] || {} // TODO Ian 2018-04-02 use robotState selector. (Liquid state falls back to {} for empty well)
          ),
        }
      }, {})

  return {
    ...prevLiquidState,
    pipettes: {
      ...prevLiquidState.pipettes,
      [pipette]: mapValues(splitLiquidStates, 'source'),
    },
    labware: {
      ...prevLiquidState.labware,
      [labware]: {
        ...prevLiquidState.labware[labware],
        ...labwareLiquidState,
      },
    },
  }
}
