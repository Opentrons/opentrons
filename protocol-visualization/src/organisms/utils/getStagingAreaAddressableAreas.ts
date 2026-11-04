import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  isAddressableAreaStandardSlot,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import type { AddressableAreaName, CutoutId } from '@opentrons/shared-data'

export const getStagingAreaAddressableAreas = (
  cutoutIds: CutoutId[],
  filterStandardSlots: boolean = true
): AddressableAreaName[] => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutFixtures = deckDef.cutoutFixtures

  const addressableAreasRaw = cutoutIds.flatMap(cutoutId => {
    const addressableAreasOnCutout = cutoutFixtures.find(
      cutoutFixture => cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
    )?.providesAddressableAreas[cutoutId]
    return addressableAreasOnCutout ?? []
  })
  if (filterStandardSlots) {
    return addressableAreasRaw.filter(
      aa => !isAddressableAreaStandardSlot(aa, deckDef)
    )
  }
  return addressableAreasRaw
}
