import { parseAllAddressableAreas } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, getDeckDefFromRobotTypeV4 } from '@opentrons/shared-data'

import type { CutoutId, DeckConfiguration, RunTimeCommand, Cutout, CutoutFixtureId, CutoutFixture, AddressableArea } from '@opentrons/shared-data'

interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
}

export const FLEX_SIMPLEST_DECK_CONFIG: CutoutConfig[] = [
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

export function getAllCutoutConfigsFromProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): CutoutConfig[] {
  // TODO(BC, 2023-11-06): abstract out the robot type 
  const deckDef = getDeckDefFromRobotTypeV4(FLEX_ROBOT_TYPE)
  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)

  const simplestDeckConfig = addressableAreas.reduce<CutoutConfig[]>((acc, addressableArea) => {
    const cutoutFixturesForAddressableArea = getCutoutFixturesForAddressableArea(addressableArea, deckDef.cutoutFixtures)
    const cutoutIdForAddressableArea = getCutoutIdForAddressableArea(addressableArea, cutoutFixturesForAddressableArea)
    const cutoutFixturesForCutoutId = cutoutIdForAddressableArea != null ? getCutoutFixturesForCutoutId(cutoutIdForAddressableArea, deckDef.cutoutFixtures) : null

    const simplestCutoutFixtureId = cutoutFixturesForAddressableArea[0]?.id

    const existingCutoutConfig = acc.find(cutoutConfig => cutoutConfig.cutoutId === cutoutIdForAddressableArea)

    if (existingCutoutConfig != null && cutoutFixturesForCutoutId != null) {
      const indexOfExistingFixture = cutoutFixturesForCutoutId.findIndex(({ id }) => (
        id === existingCutoutConfig.cutoutFixtureId
      ))
      const indexOfCurrentFixture = cutoutFixturesForCutoutId.findIndex(({ id }) => (
        id === simplestCutoutFixtureId
      ))

      if (indexOfCurrentFixture > indexOfExistingFixture) {
        const accIndex = acc.findIndex(({ cutoutId }) => cutoutId === cutoutIdForAddressableArea)

        return [
          ...acc.slice(0, accIndex),
          { cutoutId: cutoutIdForAddressableArea, cutoutFixtureId: simplestCutoutFixtureId },
          ...acc.slice(accIndex + 1),
        ]
      }
    }
    return acc
  }, FLEX_SIMPLEST_DECK_CONFIG)

  return simplestDeckConfig
}

// TODO(BC, 11/7/23): remove this function in favor of getAllCutoutConfigsFromProtocolCommands
export function getDeckConfigFromProtocolCommands(commands: RunTimeCommand[]): DeckConfiguration {
  return getAllCutoutConfigsFromProtocolCommands(commands).map(({ cutoutId, cutoutFixtureId }) => ({
    fixtureId: cutoutFixtureId,
    fixtureLocation: cutoutId as Cutout,
    loadName: cutoutFixtureId
  }))
}

function getCutoutFixturesForAddressableArea(addressableArea: AddressableArea, cutoutFixtures: CutoutFixture[]): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture => (
    Object.values(cutoutFixture.providesAddressableAreas).some(providedAAs => providedAAs.includes(addressableArea))
  ))
}

function getCutoutFixturesForCutoutId(cutoutId: CutoutId, cutoutFixtures: CutoutFixture[]): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture => cutoutFixture.mayMountTo.some(mayMountTo => mayMountTo.includes(cutoutId)))
}

function getCutoutIdForAddressableArea(addressableArea: AddressableArea, cutoutFixtures: CutoutFixture[]): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] = Object.entries(cutoutFixture.providesAddressableAreas).find(([_cutoutId, providedAAs]) => providedAAs.includes(addressableArea)) ?? []
    return cutoutId as CutoutId ?? acc
  }, null)
}
