import assert from 'assert'
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
type LiquidState = RobotState['liquidState']
export interface DispenseUpdateLiquidStateArgs {
  invariantContext: InvariantContext
  prevLiquidState: LiquidState
  pipetteId: string
  // volume value is required when useFullVolume is false
  useFullVolume: boolean
  wellName?: string
  labwareId?: string
  volume?: number
}

/** This is a helper to do dispense/blowout liquid state updates. */
export function dispenseUpdateLiquidState(
  args: DispenseUpdateLiquidStateArgs
): void {
  const {
    invariantContext,
    labwareId,
    pipetteId,
    prevLiquidState,
    useFullVolume,
    volume,
    wellName,
  } = args
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  const wasteChuteId = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'wasteChute')?.id
  const sourceId =
    labwareId != null
      ? invariantContext.labwareEntities[labwareId].id
      : wasteChuteId ?? ''

  if (sourceId === '') {
    console.error(
      `expected to find a waste chute entity id but could not, with wasteChuteId ${wasteChuteId}`
    )
  }

  //  stubbing in A1 for waste chute well to track liquid state
  const well = wellName ?? 'A1'

  const labwareDef =
    labwareId != null ? invariantContext.labwareEntities[labwareId].def : null

  assert(
    !(useFullVolume && typeof volume === 'number'),
    'dispenseUpdateLiquidState takes either `volume` or `useFullVolume`, but got both'
  )
  assert(
    typeof volume === 'number' || useFullVolume,
    'in dispenseUpdateLiquidState, either volume or useFullVolume are required'
  )
  const { wellsForTips, allWellsShared } =
    labwareDef != null && wellName != null
      ? getWellsForTips(pipetteSpec.channels, labwareDef, wellName)
      : //  special-casing waste chute info
        { wellsForTips: ['A1'], allWellsShared: true }

  const liquidLabware =
    prevLiquidState.labware[sourceId] ??
    prevLiquidState.additionalEquipment[sourceId]

  // remove liquid from pipette tips,
  // create intermediate object where sources are updated tip liquid states
  // and dests are "droplets" that need to be merged to dest well contents
  const splitLiquidStates: Record<string, SourceAndDest> = mapValues(
    prevLiquidState.pipettes[pipetteId],
    (prevTipLiquidState: LocationLiquidState): SourceAndDest => {
      if (useFullVolume) {
        const totalTipVolume = getLocationTotalVolume(prevTipLiquidState)
        return totalTipVolume > 0
          ? splitLiquid(totalTipVolume, prevTipLiquidState)
          : {
              source: {},
              dest: {},
            }
      }

      return splitLiquid(volume || 0, prevTipLiquidState)
    }
  )

  const mergeLiquidtoSingleWell = {
    [well]: reduce(
      splitLiquidStates,
      (wellLiquidStateAcc, splitLiquidStateForTip: SourceAndDest) => {
        const res = mergeLiquid(wellLiquidStateAcc, splitLiquidStateForTip.dest)
        return res
      },
      liquidLabware[well]
    ),
  }
  const mergeTipLiquidToOwnWell = wellsForTips.reduce(
    (acc, wellForTip, tipIdx) => {
      return {
        ...acc,
        [wellForTip]: mergeLiquid(
          splitLiquidStates[`${tipIdx}`].dest,
          liquidLabware[wellForTip] || {} // TODO Ian 2018-04-02 use robotState selector. (Liquid state falls back to {} for empty well)
        ),
      }
    },
    {}
  )
  // add liquid to well(s)
  const labwareLiquidState = allWellsShared
    ? mergeLiquidtoSingleWell
    : mergeTipLiquidToOwnWell
  prevLiquidState.pipettes[pipetteId] = mapValues(splitLiquidStates, 'source')
  if (prevLiquidState.additionalEquipment[sourceId] != null) {
    prevLiquidState.additionalEquipment[sourceId] = Object.assign(
      liquidLabware,
      labwareLiquidState
    )
  } else if (prevLiquidState.labware[sourceId] != null) {
    prevLiquidState.labware[sourceId] = Object.assign(
      liquidLabware,
      labwareLiquidState
    )
  }
}
