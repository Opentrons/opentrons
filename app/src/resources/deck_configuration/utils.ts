import { parseAllAddressableAreas } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, getDeckDefFromRobotTypeV4 } from '@opentrons/shared-data'

import type { CutoutId, DeckConfiguration, RunTimeCommand, Cutout, CutoutFixtureId } from '@opentrons/shared-data'

interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
}

const FLEX_SIMPLEST_DECK_CONFIG: CutoutConfig[] = [
  { cutoutId: 'cutoutA1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutB1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutC1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutD1', cutoutFixtureId: 'singleLeftSlot' },
  { cutoutId: 'cutoutA2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutB2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutC2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutD2', cutoutFixtureId: 'singleCenterSlot' },
  { cutoutId: 'cutoutA3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutB3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutC3', cutoutFixtureId: 'singleRightSlot' },
  { cutoutId: 'cutoutD3', cutoutFixtureId: 'singleRightSlot' },
]

export function getDeckConfigFromProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): DeckConfiguration {
  // TODO(BC, 2023-11-06): abstract out the robot type 
  const deckDef = getDeckDefFromRobotTypeV4(FLEX_ROBOT_TYPE)
  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)

  const defaultDeckConfig = addressableAreas.reduce<CutoutConfig[]>((acc, addressableArea) => {
    let matchedCutoutId
    let matchedCutoutFixture
    console.log('Addressable Area', addressableArea)
    deckDef.cutoutFixtures.forEach(cutoutFixture => {
      Object.entries(cutoutFixture.providesAddressableAreas).forEach(([cutoutId, providedAddressableAreas]) => {
        if (providedAddressableAreas.includes(addressableArea)) {
          matchedCutoutId = cutoutId
          matchedCutoutFixture = cutoutFixture
        }
      })
    })
    return matchedCutoutFixture != null && matchedCutoutId != null 
    ? [...acc, { cutoutId: matchedCutoutId, cutoutFixtureId: matchedCutoutFixture }]
    : acc
  }, FLEX_SIMPLEST_DECK_CONFIG)

  return defaultDeckConfig.map(({cutoutId, cutoutFixtureId}) => ({
    fixtureId: cutoutFixtureId,
    fixtureLocation: cutoutId as Cutout,
    loadName: cutoutFixtureId
  }))
}
