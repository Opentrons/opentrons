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
  labwareId: string
  pipetteId: string
  wellName: string
  volume?: number
  // volume value is required when useFullVolume is false
  useFullVolume: boolean
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

  let wasteChuteOrLabware: 'wasteChute' | 'labware' | null
  let well: string = wellName
  if (invariantContext.labwareEntities[labwareId] != null) {
    wasteChuteOrLabware = 'labware'
  } else if (invariantContext.additionalEquipmentEntities[labwareId] != null) {
    wasteChuteOrLabware = 'wasteChute'
    well = 'A1'
  } else {
    console.error(
      `expected to determine if dest labware is a labware or waste chute with destLabware ${labwareId} but could not`
    )
    wasteChuteOrLabware = null
  }
  const labwareDef =
    wasteChuteOrLabware === 'labware'
      ? invariantContext.labwareEntities[labwareId].def
      : null

  assert(
    !(useFullVolume && typeof volume === 'number'),
    'dispenseUpdateLiquidState takes either `volume` or `useFullVolume`, but got both'
  )
  assert(
    typeof volume === 'number' || useFullVolume,
    'in dispenseUpdateLiquidState, either volume or useFullVolume are required'
  )
  const { wellsForTips, allWellsShared } =
    labwareDef != null
      ? getWellsForTips(pipetteSpec.channels, labwareDef, wellName)
      : //  special-casing waste chute info
        { wellsForTips: ['A1'], allWellsShared: true }

  const wasteChuteLocationLiquidState: LocationLiquidState = {
    wasteChute: { volume: 0 },
  }
  const wasteChuteLiquidState = {
    A1: wasteChuteLocationLiquidState,
  }

  const liquidLabware =
    prevLiquidState.labware[labwareId] ?? wasteChuteLiquidState
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
  prevLiquidState.labware[labwareId] = Object.assign(
    liquidLabware,
    labwareLiquidState
  )
}
