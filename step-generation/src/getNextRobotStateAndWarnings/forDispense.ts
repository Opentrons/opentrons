import range from 'lodash/range'

import {
  COLUMN,
  PARTIAL,
  PARTIAL_NOZZLE_MAP,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import { AIR_GAP_LIQUID_STATE_CONST } from '../constants'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type {
  AspDispAirgapParams,
  DispenseInPlaceParams,
  PartialPrimaryNozzles,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forDispense(
  params: AspDispAirgapParams | DispenseInPlaceParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, volume } = params
  const { robotState } = robotStateAndWarnings
  const entityId =
    'labwareId' in params
      ? params.labwareId
      : (robotState.pipettes[pipetteId].entityId ?? '')
  const wellName =
    'wellName' in params
      ? params.wellName
      : (robotState.pipettes[pipetteId].wellName ?? '')
  const pipetteState = robotState.liquidState.pipettes[pipetteId]
  const firstTipState = Object.values(pipetteState)[0] // airGap volume is the same for each tip
  const airGapVolume = firstTipState?.[AIR_GAP_LIQUID_STATE_CONST]?.volume ?? 0
  const primaryNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].primaryNozzle

  // NOTE: (ja, 1/10/26): if airGapVolume is not null, assume that the dispense command
  // is for dispensing the air gap - NOTE: this is only used for PV right now
  if (airGapVolume > 0) {
    const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
    const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
    let channels: number = pipetteSpec.channels
    if (nozzles === COLUMN) {
      channels = 8
    } else if (nozzles === SINGLE) {
      channels = 1
    } else if (nozzles === ROW) {
      channels = 12
    } else if (nozzles === PARTIAL) {
      channels = PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    }
    range(channels).forEach((tipIndex): void => {
      const prev = robotState.liquidState.pipettes[pipetteId][tipIndex] ?? {}

      robotState.liquidState.pipettes[pipetteId][tipIndex] = {
        ...prev,
        [AIR_GAP_LIQUID_STATE_CONST]: { volume: 0 },
      }
    })
  } else {
    dispenseUpdateLiquidState({
      invariantContext,
      entityId,
      pipetteId,
      prevLiquidState: robotState.liquidState,
      useFullVolume: false,
      volume,
      wellName,
      robotStateAndWarnings,
    })
  }
  // set the entityId for dispense if it was not previously set in the previous moveToWell
  if ('labwareId' in params) {
    robotState.pipettes[pipetteId] = {
      ...robotState.pipettes[pipetteId],
      entityId: params.labwareId,
    }
  }
}
