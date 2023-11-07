import { parseAllAddressableAreas } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, getDeckDefFromRobotTypeV4 } from '@opentrons/shared-data'

import type { CutoutId, DeckConfiguration, RunTimeCommand, Cutout, CutoutFixtureId, CutoutFixture, AddressableArea } from '@opentrons/shared-data'

interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
  requiredAddressableAreas: AddressableArea[]
}

export const FLEX_SIMPLEST_DECK_CONFIG: CutoutConfig[] = [
  { cutoutId: 'cutoutA1', cutoutFixtureId: 'singleLeftSlot', requiredAddressableAreas: ['A1'] },
  { cutoutId: 'cutoutB1', cutoutFixtureId: 'singleLeftSlot', requiredAddressableAreas: ['B1'] },
  { cutoutId: 'cutoutC1', cutoutFixtureId: 'singleLeftSlot', requiredAddressableAreas: ['C1'] },
  { cutoutId: 'cutoutD1', cutoutFixtureId: 'singleLeftSlot', requiredAddressableAreas: ['D1'] },
  { cutoutId: 'cutoutA2', cutoutFixtureId: 'singleCenterSlot', requiredAddressableAreas: ['A2'] },
  { cutoutId: 'cutoutB2', cutoutFixtureId: 'singleCenterSlot', requiredAddressableAreas: ['B2'] },
  { cutoutId: 'cutoutC2', cutoutFixtureId: 'singleCenterSlot', requiredAddressableAreas: ['C2'] },
  { cutoutId: 'cutoutD2', cutoutFixtureId: 'singleCenterSlot', requiredAddressableAreas: ['D2'] },
  { cutoutId: 'cutoutA3', cutoutFixtureId: 'singleRightSlot', requiredAddressableAreas: ['A3'] },
  { cutoutId: 'cutoutB3', cutoutFixtureId: 'singleRightSlot', requiredAddressableAreas: ['B3'] },
  { cutoutId: 'cutoutC3', cutoutFixtureId: 'singleRightSlot', requiredAddressableAreas: ['C3'] },
  { cutoutId: 'cutoutD3', cutoutFixtureId: 'singleRightSlot', requiredAddressableAreas: ['D3'] },
]

export function getAllCutoutConfigsFromProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): CutoutConfig[] {
  // TODO(BC, 2023-11-06): abstract out the robot type 
  const deckDef = getDeckDefFromRobotTypeV4(FLEX_ROBOT_TYPE)

  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)
  const simplestDeckConfig = addressableAreas.reduce<CutoutConfig[]>((acc, addressableArea) => {
    const cutoutFixturesForAddressableArea = getCutoutFixturesForAddressableAreas([addressableArea], deckDef.cutoutFixtures)
    const cutoutIdForAddressableArea = getCutoutIdForAddressableArea(addressableArea, cutoutFixturesForAddressableArea)
    const cutoutFixturesForCutoutId = cutoutIdForAddressableArea != null ? getCutoutFixturesForCutoutId(cutoutIdForAddressableArea, deckDef.cutoutFixtures) : null


    const existingCutoutConfig = acc.find(cutoutConfig => cutoutConfig.cutoutId === cutoutIdForAddressableArea)

    if (existingCutoutConfig != null && cutoutFixturesForCutoutId != null) {
      const indexOfExistingFixture = cutoutFixturesForCutoutId.findIndex(({ id }) => (
        id === existingCutoutConfig.cutoutFixtureId
      ))

      const accIndex = acc.findIndex(({ cutoutId }) => cutoutId === cutoutIdForAddressableArea)
      const allNextRequiredAddressableAreas = acc[accIndex].requiredAddressableAreas.includes(addressableArea) ? [...acc[accIndex].requiredAddressableAreas, addressableArea] : acc[accIndex].requiredAddressableAreas
      console.log('allNextRequiredAddressableAreas', allNextRequiredAddressableAreas)
      const nextCompatibleCutoutFixtures = getCutoutFixturesForAddressableAreas(allNextRequiredAddressableAreas, cutoutFixturesForCutoutId)
      console.log('nextCompatibleCutoutFixtures', nextCompatibleCutoutFixtures)
      const nextCompatibleCutoutFixtureId = nextCompatibleCutoutFixtures[0]?.id
      const indexOfCurrentFixture = cutoutFixturesForCutoutId.findIndex(({ id }) => (id === nextCompatibleCutoutFixtureId))

      if (indexOfCurrentFixture > indexOfExistingFixture) {

        return [
          ...acc.slice(0, accIndex),
          { cutoutId: cutoutIdForAddressableArea, cutoutFixtureId: nextCompatibleCutoutFixtureId, requiredAddressableAreas: allNextRequiredAddressableAreas },
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

function getCutoutFixturesForAddressableAreas(addressableAreas: AddressableArea[], cutoutFixtures: CutoutFixture[]): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture => (
    Object.values(cutoutFixture.providesAddressableAreas).some(providedAAs => addressableAreas.every(aa => providedAAs.includes(aa)))
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
