import range from 'lodash/range'

import { COLUMN, SINGLE } from '@opentrons/shared-data'

import { AIR } from '../utils'

import type { AirGapInPlaceParams } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

// NOTE: this update happens in PD and PV but the value is only read
// for PV to visualize the air gap and not include it in the liquid state
export function forAirGapInPlace(
  params: AirGapInPlaceParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, volume } = params
  const { robotState } = robotStateAndWarnings
  const nozzles = robotState.pipettes[pipetteId].nozzles
  const pipetteSpec = invariantContext.pipetteEntities[pipetteId].spec
  let channels = pipetteSpec.channels
  if (nozzles === COLUMN) {
    channels = 8
  } else if (nozzles === SINGLE) {
    channels = 1
  }
  range(channels).forEach((tipIndex): void => {
    const prev = robotState.liquidState.pipettes[pipetteId][tipIndex] ?? {}

    const prevAirGapVolume = prev[AIR]?.volume ?? 0

    robotState.liquidState.pipettes[pipetteId][tipIndex] = {
      ...prev,
      [AIR]: {
        volume: prevAirGapVolume + volume, // add previous air gap (if exists) + current
      },
    }
  })
}
