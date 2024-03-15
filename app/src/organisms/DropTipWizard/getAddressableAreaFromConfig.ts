import {
  EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import type {
  AddressableAreaName,
  DeckConfiguration,
  RobotType,
} from '@opentrons/shared-data'

export function getAddressableAreaFromConfig(
  addressableArea: AddressableAreaName,
  deckConfig: DeckConfiguration,
  pipetteChannels: number,
  robotType: RobotType
): AddressableAreaName | null {
  const deckDef = getDeckDefFromRobotType(robotType)

  let addressableAreaFromConfig: AddressableAreaName | null = null

  // match the cutout id to aa
  const cutoutIdForAddressableArea = getCutoutIdForAddressableArea(
    addressableArea,
    deckDef.cutoutFixtures
  )

  // get addressable areas provided by current deck config
  const configuredCutoutFixture =
    deckConfig.find(fixture => fixture.cutoutId === cutoutIdForAddressableArea)
      ?.cutoutFixtureId ?? null

  const providedAddressableAreas =
    cutoutIdForAddressableArea != null
      ? deckDef.cutoutFixtures.find(
          fixture => fixture.id === configuredCutoutFixture
        )?.providesAddressableAreas[cutoutIdForAddressableArea] ?? []
      : []

  // check if configured cutout fixture id provides target addressableArea
  if (providedAddressableAreas.includes(addressableArea)) {
    addressableAreaFromConfig = addressableArea
  } else if (
    // if no, check if provides a movable trash
    providedAddressableAreas.some(aa =>
      MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(aa)
    )
  ) {
    addressableAreaFromConfig = providedAddressableAreas[0]
  } else if (
    // if no, check if provides waste chute
    providedAddressableAreas.some(aa =>
      WASTE_CHUTE_ADDRESSABLE_AREAS.includes(aa)
    )
  ) {
    // match number of channels to provided waste chute addressable area
    if (
      pipetteChannels === 1 &&
      providedAddressableAreas.includes(
        ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
      )
    ) {
      addressableAreaFromConfig = ONE_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    } else if (
      pipetteChannels === 8 &&
      providedAddressableAreas.includes(
        EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
      )
    ) {
      addressableAreaFromConfig = EIGHT_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    } else if (
      pipetteChannels === 96 &&
      providedAddressableAreas.includes(
        NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
      )
    ) {
      addressableAreaFromConfig = NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA
    }
  }

  return addressableAreaFromConfig
}
