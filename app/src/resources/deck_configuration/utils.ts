import { parseAllAddressableAreas } from '@opentrons/api-client'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotTypeV4,
} from '@opentrons/shared-data'

import type {
  CutoutId,
  DeckConfiguration,
  RunTimeCommand,
  Cutout,
  CutoutFixtureId,
  CutoutFixture,
  AddressableAreaName,
  FixtureLoadName,
} from '@opentrons/shared-data'

interface CutoutConfig {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId
  requiredAddressableAreas: AddressableAreaName[]
}

export const FLEX_SIMPLEST_DECK_CONFIG: CutoutConfig[] = [
  {
    cutoutId: 'cutoutA1',
    cutoutFixtureId: 'singleLeftSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutB1',
    cutoutFixtureId: 'singleLeftSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutC1',
    cutoutFixtureId: 'singleLeftSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutD1',
    cutoutFixtureId: 'singleLeftSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutA2',
    cutoutFixtureId: 'singleCenterSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutB2',
    cutoutFixtureId: 'singleCenterSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutC2',
    cutoutFixtureId: 'singleCenterSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutD2',
    cutoutFixtureId: 'singleCenterSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutA3',
    cutoutFixtureId: 'singleRightSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutB3',
    cutoutFixtureId: 'singleRightSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutC3',
    cutoutFixtureId: 'singleRightSlot',
    requiredAddressableAreas: [],
  },
  {
    cutoutId: 'cutoutD3',
    cutoutFixtureId: 'singleRightSlot',
    requiredAddressableAreas: [],
  },
]

export function getSimplestDeckConfigForProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): CutoutConfig[] {
  // TODO(BC, 2023-11-06): abstract out the robot type
  const deckDef = getDeckDefFromRobotTypeV4(FLEX_ROBOT_TYPE)

  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)
  const simplestDeckConfig = addressableAreas.reduce<CutoutConfig[]>(
    (acc, addressableArea) => {
      const cutoutFixturesForAddressableArea = getCutoutFixturesForAddressableAreas(
        [addressableArea],
        deckDef.cutoutFixtures
      )
      const cutoutIdForAddressableArea = getCutoutIdForAddressableArea(
        addressableArea,
        cutoutFixturesForAddressableArea
      )
      const cutoutFixturesForCutoutId =
        cutoutIdForAddressableArea != null
          ? getCutoutFixturesForCutoutId(
              cutoutIdForAddressableArea,
              deckDef.cutoutFixtures
            )
          : null

      const existingCutoutConfig = acc.find(
        cutoutConfig => cutoutConfig.cutoutId === cutoutIdForAddressableArea
      )

      if (
        existingCutoutConfig != null &&
        cutoutFixturesForCutoutId != null &&
        cutoutIdForAddressableArea != null
      ) {
        const indexOfExistingFixture = cutoutFixturesForCutoutId.findIndex(
          ({ id }) => id === existingCutoutConfig.cutoutFixtureId
        )
        const accIndex = acc.findIndex(
          ({ cutoutId }) => cutoutId === cutoutIdForAddressableArea
        )
        const previousRequiredAAs = acc[accIndex]?.requiredAddressableAreas
        const allNextRequiredAddressableAreas = previousRequiredAAs.includes(
          addressableArea
        )
          ? previousRequiredAAs
          : [...previousRequiredAAs, addressableArea]
        const nextCompatibleCutoutFixture = getSimplestFixtureForAddressableAreas(
          cutoutIdForAddressableArea,
          allNextRequiredAddressableAreas,
          cutoutFixturesForCutoutId
        )
        const indexOfCurrentFixture = cutoutFixturesForCutoutId.findIndex(
          ({ id }) => id === nextCompatibleCutoutFixture?.id
        )

        if (
          nextCompatibleCutoutFixture != null &&
          indexOfCurrentFixture > indexOfExistingFixture
        ) {
          return [
            ...acc.slice(0, accIndex),
            {
              cutoutId: cutoutIdForAddressableArea,
              cutoutFixtureId: nextCompatibleCutoutFixture.id,
              requiredAddressableAreas: allNextRequiredAddressableAreas,
            },
            ...acc.slice(accIndex + 1),
          ]
        }
      }
      return acc
    },
    FLEX_SIMPLEST_DECK_CONFIG
  )

  return simplestDeckConfig
}

// TODO(BC, 11/7/23): remove this function in favor of getSimplestDeckConfigForProtocolCommands
export function getDeckConfigFromProtocolCommands(
  commands: RunTimeCommand[]
): DeckConfiguration {
  return getSimplestDeckConfigForProtocolCommands(commands).map(
    ({ cutoutId, cutoutFixtureId }) => ({
      fixtureId: cutoutFixtureId,
      fixtureLocation: cutoutId as Cutout,
      loadName: cutoutFixtureId as FixtureLoadName,
    })
  )
}

export function getCutoutFixturesForAddressableAreas(
  addressableAreas: AddressableAreaName[],
  cutoutFixtures: CutoutFixture[]
): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture =>
    Object.values(cutoutFixture.providesAddressableAreas).some(providedAAs =>
      addressableAreas.every(aa => providedAAs.includes(aa))
    )
  )
}

export function getCutoutFixturesForCutoutId(
  cutoutId: CutoutId,
  cutoutFixtures: CutoutFixture[]
): CutoutFixture[] {
  return cutoutFixtures.filter(cutoutFixture =>
    cutoutFixture.mayMountTo.some(mayMountTo => mayMountTo.includes(cutoutId))
  )
}

export function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}

export function getSimplestFixtureForAddressableAreas(
  cutoutId: CutoutId,
  requiredAddressableAreas: AddressableAreaName[],
  allCutoutFixtures: CutoutFixture[]
): CutoutFixture | null {
  const cutoutFixturesForCutoutId = getCutoutFixturesForCutoutId(
    cutoutId,
    allCutoutFixtures
  )
  const nextCompatibleCutoutFixtures = getCutoutFixturesForAddressableAreas(
    requiredAddressableAreas,
    cutoutFixturesForCutoutId
  )
  return nextCompatibleCutoutFixtures?.[0] ?? null
}
