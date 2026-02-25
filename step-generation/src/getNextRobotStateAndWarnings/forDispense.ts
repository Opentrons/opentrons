import range from 'lodash/range'

import { COLUMN, SINGLE } from '@opentrons/shared-data'

import { AIR_GAP_LIQUID_STATE_CONST } from '../constants'
import { dispenseUpdateLiquidState } from './dispenseUpdateLiquidState'

import type {
  AspDispAirgapParams,
  DispenseInPlaceParams,
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

  // NOTE: (ja, 1/10/26): if airGapVolume is not null, assume that the dispense command
  // is for dispensing the air gap - NOTE: this is only used for PV right now
  if (airGapVolume > 0) {
    const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
    const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
    let channels = pipetteSpec.channels
    if (nozzles === COLUMN) {
      channels = 8
    } else if (nozzles === SINGLE) {
      channels = 1
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
      ...('wellName' in params && params.wellName != null
        ? { wellName: params.wellName }
        : {}),
      ...('wellLocation' in params && params.wellLocation != null
        ? { wellLocation: params.wellLocation }
        : {}),
    }
  }
}
