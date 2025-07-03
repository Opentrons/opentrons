import { WASTE_CHUTE_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import { getTrashLocationFromAddressableAreaName } from '../utils'

import type {
  MoveToAddressableAreaForDropTipParams,
  MoveToAddressableAreaParams,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveToAddressableArea(
  params: MoveToAddressableAreaParams | MoveToAddressableAreaForDropTipParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { pipetteId, addressableAreaName } = params
  const { wasteChuteEntities, trashBinEntities } = invariantContext
  const addressableAreaInWasteChute = WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
    addressableAreaName
  )
  const trashBinId = Object.values(trashBinEntities).find(
    trash =>
      trash.location ===
      getTrashLocationFromAddressableAreaName(addressableAreaName)
  )?.id

  const location = addressableAreaInWasteChute
    ? Object.values(wasteChuteEntities)[0].id
    : trashBinId ?? 'home'
  const { robotState } = robotStateAndWarnings
  robotState.pipettes[pipetteId] = {
    ...robotState.pipettes[pipetteId],
    location,
  }
}
