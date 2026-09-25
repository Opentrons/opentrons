import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import { getActiveNozzleAmount } from '../utils/getActiveNozzleAmount'
import {
  getLocationTotalVolume,
  getWellsForTips,
  mergeLiquid,
  splitLiquid,
} from '../utils/misc'

import type {
  InvariantContext,
  LocationLiquidState,
  RobotState,
  RobotStateAndWarnings,
  SourceAndDest,
} from '../types'

type LiquidState = RobotState['liquidState']
export interface DispenseUpdateLiquidStateArgs {
  invariantContext: InvariantContext
  prevLiquidState: LiquidState
  pipetteId: string
  // volume value is required when useFullVolume is false
  useFullVolume: boolean
  robotStateAndWarnings: RobotStateAndWarnings
  entityId: string
  wellName?: string
  volume?: number
}

/** This is a helper to do dispense/blowout liquid state updates. */
export function dispenseUpdateLiquidState(
  args: DispenseUpdateLiquidStateArgs
): void {
  const {
    robotStateAndWarnings,
    invariantContext,
    entityId,
    pipetteId,
    prevLiquidState,
    useFullVolume,
    volume,
    wellName,
  } = args
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
  const primaryNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].primaryNozzle
  const backLeftNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].backLeftNozzle
  const activeChannels = getActiveNozzleAmount({
    pipetteSpec,
    nozzles,
    primaryNozzle,
    backLeftNozzle,
  })

  const well = wellName ?? null

  const labwareDef =
    invariantContext.labwareEntities[entityId] != null
      ? invariantContext.labwareEntities[entityId].def
      : null

  console.assert(
    !(useFullVolume && typeof volume === 'number'),
    'dispenseUpdateLiquidState takes either `volume` or `useFullVolume`, but got both'
  )
  console.assert(
    typeof volume === 'number' || useFullVolume,
    'in dispenseUpdateLiquidState, either volume or useFullVolume are required'
  )
  const { wellsForTips, allWellsShared } =
    labwareDef != null && wellName != null
      ? getWellsForTips(activeChannels, labwareDef, wellName)
      : { wellsForTips: null, allWellsShared: true }

  const liquidLabware =
    prevLiquidState.labware[entityId] != null
      ? prevLiquidState.labware[entityId]
      : null

  let liquidTrash: LocationLiquidState | null = null
  if (prevLiquidState.trashBins[entityId] != null) {
    liquidTrash = prevLiquidState.trashBins[entityId]
  } else if (prevLiquidState.wasteChute[entityId] != null) {
    liquidTrash = prevLiquidState.wasteChute[entityId]
  }

  // remove liquid from pipette tips,
  // create intermediate object where sources are updated tip liquid states
  // and dests are "droplets" that need to be merged to dest well contents
  const splitLiquidStates: Record<string, SourceAndDest> = mapValues(
    prevLiquidState.pipettes[pipetteId],
    (prevTipLiquidState: LocationLiquidState): SourceAndDest => {
      const { ...liquidOnlyState } = prevTipLiquidState

      if (useFullVolume) {
        const totalTipVolume = getLocationTotalVolume(liquidOnlyState)

        return totalTipVolume > 0
          ? splitLiquid(totalTipVolume, liquidOnlyState)
          : {
              source: {},
              dest: {},
            }
      }

      return splitLiquid(volume || 0, liquidOnlyState)
    }
  )
  let mergeLiquidtoSingleWell = null
  //  a labware will always have a well
  if (well != null && liquidLabware != null) {
    mergeLiquidtoSingleWell = {
      [well]: reduce(
        splitLiquidStates,
        (wellLiquidStateAcc, splitLiquidStateForTip: SourceAndDest) => {
          const res = mergeLiquid(
            wellLiquidStateAcc,
            splitLiquidStateForTip.dest
          )
          return res
        },
        liquidLabware[well]
      ),
    }
  } else if (liquidTrash != null) {
    const totalVolume = Object.values(
      prevLiquidState.pipettes[pipetteId]
    ).reduce((acc: number, val) => {
      return acc + (val[0]?.volume ?? 0)
    }, 0)
    liquidTrash[0] = { volume: totalVolume }
  }

  if (mergeLiquidtoSingleWell == null && liquidTrash == null) {
    console.assert(
      false,
      `expected to merge liquid to a single well with sourceId ${entityId}`
    )
  }

  const mergeTipLiquidToOwnWell =
    well != null && liquidLabware != null && wellsForTips != null
      ? wellsForTips.reduce((acc, wellForTip, tipIdx) => {
          return {
            ...acc,
            [wellForTip]: mergeLiquid(
              splitLiquidStates[`${tipIdx}`].dest,
              liquidLabware[wellForTip] || {} // TODO Ian 2018-04-02 use robotState selector. (Liquid state falls back to {} for empty well)
            ),
          }
        }, {})
      : {}

  // add liquid to well(s)
  const labwareLiquidState = allWellsShared
    ? mergeLiquidtoSingleWell
    : mergeTipLiquidToOwnWell
  prevLiquidState.pipettes[pipetteId] = mapValues(splitLiquidStates, 'source')
  if (prevLiquidState.trashBins[entityId] != null && liquidTrash != null) {
    Object.assign(prevLiquidState.trashBins[entityId], liquidTrash)
  } else if (
    prevLiquidState.wasteChute[entityId] != null &&
    liquidTrash != null
  ) {
    Object.assign(prevLiquidState.wasteChute[entityId], liquidTrash)
  } else if (
    prevLiquidState.labware[entityId] != null &&
    labwareLiquidState != null
  ) {
    prevLiquidState.labware[entityId] = Object.assign(
      liquidLabware ?? {},
      labwareLiquidState
    )
  }
}
