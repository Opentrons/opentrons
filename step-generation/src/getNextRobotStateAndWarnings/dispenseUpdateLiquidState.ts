import mapValues from 'lodash/mapValues'
import reduce from 'lodash/reduce'

import { COLUMN, SINGLE } from '@opentrons/shared-data'

import {
  getLocationTotalVolume,
  getWellsForTips,
  mergeLiquid,
  mergeLiquidForTrash,
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
  let channels = pipetteSpec.channels
  if (nozzles === COLUMN) {
    channels = 8
  } else if (nozzles === SINGLE) {
    channels = 1
  }

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
      ? getWellsForTips(channels, labwareDef, wellName)
      : { wellsForTips: null, allWellsShared: true }

  const liquidLabware =
    prevLiquidState.labware[entityId] != null
      ? prevLiquidState.labware[entityId]
      : null

  console.log('prevLiquidState', JSON.parse(JSON.stringify(prevLiquidState)))
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
      if (useFullVolume) {
        const totalTipVolume = getLocationTotalVolume(prevTipLiquidState)
        console.log('totalTipVolume', totalTipVolume)
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
  console.log(
    '   prevLiquidState.pipettes[pipetteId]',
    JSON.parse(JSON.stringify(prevLiquidState.pipettes[pipetteId]))
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
  }
  // const test =
  //   prevLiquidState.pipettes[pipetteId] != null
  //     ? getLocationTotalVolume(prevLiquidState.pipettes[pipetteId])
  //     : {}
  // console.log(test)

  const pipetteRobotState = prevLiquidState.pipettes[pipetteId]
  console.log(
    'pipetteRobotState',
    JSON.parse(JSON.stringify(pipetteRobotState))
  )
  //  waste chute and trash bin don't have wells
  if (well == null && liquidTrash != null && pipetteRobotState != null) {
    mergeLiquidtoSingleWell = reduce(
      pipetteRobotState,
      (acc: LocationLiquidState, liquid) => {
        const totalVolume = getLocationTotalVolume(liquid)
        console.log(
          'totalVolume',
          JSON.parse(JSON.stringify(liquid)),
          totalVolume
        )
        acc[0] = { volume: totalVolume }

        return acc
      },
      {}
    )
  }

  console.log(
    'mergeLiquidtoSingleWell',
    JSON.parse(JSON.stringify(liquidTrash)),
    JSON.parse(JSON.stringify(splitLiquidStates)),

    JSON.parse(JSON.stringify(mergeLiquidtoSingleWell))
  )
  if (mergeLiquidtoSingleWell == null) {
    console.assert(
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
  if (liquidTrash != null && labwareLiquidState != null) {
    console.log(
      'hit here',

      JSON.parse(JSON.stringify(labwareLiquidState))
    )
    liquidTrash = Object.assign(labwareLiquidState)
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
