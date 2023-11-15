import { parseAllAddressableAreas } from '@opentrons/api-client'
import {
  FLEX_ROBOT_TYPE,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotTypeV4,
} from '@opentrons/shared-data'

import type {
  CutoutId,
  RunTimeCommand,
  CutoutFixtureId,
  CutoutFixture,
  AddressableAreaName,
  DeckDefinition,
} from '@opentrons/shared-data'

export interface CutoutConfigProtocolSpec {
  cutoutId: CutoutId
  cutoutFixtureId: CutoutFixtureId | null
  requiredAddressableAreas: AddressableAreaName[]
}

export const FLEX_SIMPLEST_DECK_CONFIG: CutoutConfigProtocolSpec[] = [
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
): CutoutConfigProtocolSpec[] {
  // TODO(BC, 2023-11-06): abstract out the robot type
  const deckDef = getDeckDefFromRobotTypeV4(FLEX_ROBOT_TYPE)

  const addressableAreas = parseAllAddressableAreas(protocolAnalysisCommands)
  const simplestDeckConfig = addressableAreas.reduce<
    CutoutConfigProtocolSpec[]
  >((acc, addressableArea) => {
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
  }, FLEX_SIMPLEST_DECK_CONFIG)

  return simplestDeckConfig
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

export function getCutoutIdForSlotName(
  slotName: string,
  deckDef: DeckDefinition
): CutoutId | null {
  const addressableArea = getAddressableAreaFromSlotId(slotName, deckDef)
  const cutoutIdForSlotName =
    addressableArea != null
      ? getCutoutIdForAddressableArea(
          addressableArea.id,
          deckDef.cutoutFixtures
        )
      : null

  return cutoutIdForSlotName
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
