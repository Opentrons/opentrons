import { WASTE_CHUTE_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import {
  getTrashLocationFromAddressableAreaName,
  resolveStringRuntimeValue,
} from '../utils'

import type { AddressableAreaName } from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export function forMoveToAddressableArea(
  params: {
    pipetteId: string
    addressableAreaName: string
  },
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { runtimeParameters } = invariantContext
  const pipetteId = resolveStringRuntimeValue(
    params.pipetteId,
    runtimeParameters
  )
  const addressableAreaName = resolveStringRuntimeValue(
    params.addressableAreaName,
    runtimeParameters
  )
  if (pipetteId == null || addressableAreaName == null) {
    console.error(
      `forMoveToAddressableArea: arg resolved to null (pipetteId=${String(
        pipetteId
      )}, addressableAreaName=${String(addressableAreaName)})`
    )
    return
  }
  const { wasteChuteEntities, trashBinEntities } = invariantContext
  const areaName = addressableAreaName as AddressableAreaName
  const addressableAreaInWasteChute =
    WASTE_CHUTE_ADDRESSABLE_AREAS.includes(areaName)
  const trashBinId = Object.values(trashBinEntities).find(
    trash =>
      trash.location === getTrashLocationFromAddressableAreaName(areaName)
  )?.id

  const entityId = addressableAreaInWasteChute
    ? Object.values(wasteChuteEntities)[0].id
    : trashBinId
  const { robotState } = robotStateAndWarnings
  robotState.pipettes[pipetteId] = {
    ...robotState.pipettes[pipetteId],
    entityId,
  }
}
