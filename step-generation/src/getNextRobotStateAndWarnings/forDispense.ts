import { AIR } from '../utils'
import { getActiveNozzleAmount } from '../utils/getActiveNozzleAmount'
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
  const airGapVolume = firstTipState?.[AIR]?.volume ?? 0
  const primaryNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].primaryNozzle
  const backLeftNozzle =
    robotStateAndWarnings.robotState.pipettes[pipetteId].backLeftNozzle

  // NOTE: (ja, 1/10/26): if airGapVolume is not null, assume that the dispense command
  // is for dispensing the air gap - NOTE: this is only used for PV right now
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
  if (airGapVolume > 0) {
    const nozzles = robotStateAndWarnings.robotState.pipettes[pipetteId].nozzles
    const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
    const activeChannels = getActiveNozzleAmount({
      pipetteSpec,
      nozzles,
      primaryNozzle,
      backLeftNozzle,
    })
    const tipKeys = Object.keys(pipetteState).slice(0, activeChannels)
    tipKeys.forEach((tipIndex): void => {
      const prev = pipetteState[tipIndex] ?? {}
      pipetteState[tipIndex] = {
        ...prev,
        [AIR]: { volume: 0 },
      }
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
