import { parseAllAddressableAreas } from '@opentrons/api-client'
import { getDeckDefFromRobotType, FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import type { CutoutId, CutoutFixture, DeckConfiguration, RunTimeCommand, Cutout } from '@opentrons/shared-data'

export function getDeckConfigFromProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): DeckConfiguration {
  // TODO(BC, 2023-11-06): abstract out the robot type 
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)

  const defaultFixtureByCutout = addressableAreas.reduce<{[cutoutId in CutoutId]?: CutoutFixture }>((acc, addressableArea) => {
    let matchedCutoutId
    let matchedCutoutFixture
    deckDef.locations.cutoutFixtures.forEach(cutoutFixture => {
      Object.entries(cutoutFixture.providesAddressableAreas).forEach(([cutoutId, providedAddressableAreas]) => {
        if (providedAddressableAreas.includes(addressableArea)) {
          matchedCutoutId = cutoutId
          matchedCutoutFixture = cutoutFixture
        }
      })
    })
    return matchedCutoutFixture != null && matchedCutoutId != null ? { ...acc, [matchedCutoutId]: matchedCutoutFixture } : acc
  }, {})


  return Object.entries(defaultFixtureByCutout).map(([cutoutId, cutoutFixture]) => ({
    fixtureId: cutoutFixture.id,
    fixtureLocation: cutoutId as Cutout,
    loadName: cutoutFixture.id
  }))
}
