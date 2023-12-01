import { parseAllAddressableAreas } from '@opentrons/api-client'
import {
  FLEX_ROBOT_TYPE,
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import type {
  CutoutConfig,
  CutoutId,
  RunTimeCommand,
  CutoutFixture,
  AddressableAreaName,
  DeckDefinition,
  DeckConfiguration,
  CutoutFixtureId,
} from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from './hooks'

export interface CutoutConfigProtocolSpec extends CutoutConfig {
  requiredAddressableAreas: AddressableAreaName[]
}

export const FLEX_SIMPLEST_DECK_CONFIG: DeckConfiguration = [
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

export const FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC: CutoutConfigProtocolSpec[] = FLEX_SIMPLEST_DECK_CONFIG.map(
  config => ({ ...config, requiredAddressableAreas: [] })
)

export function getSimplestDeckConfigForProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): CutoutConfigProtocolSpec[] {
  // TODO(BC, 2023-11-06): abstract out the robot type
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

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
  }, FLEX_SIMPLEST_DECK_CONFIG_PROTOCOL_SPEC)

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

export function getRequiredDeckConfig<T extends CutoutConfigProtocolSpec>(
  deckConfigProtocolSpec: T[]
): T[] {
  const nonSingleSlotDeckConfigCompatibility = deckConfigProtocolSpec.filter(
    ({ requiredAddressableAreas }) =>
      // required AA list includes a non-single-slot AA
      !requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      )
  )
  // fixture includes at least 1 required AA
  const requiredDeckConfigProtocolSpec = nonSingleSlotDeckConfigCompatibility.filter(
    fixture => fixture.requiredAddressableAreas.length > 0
  )

  return requiredDeckConfigProtocolSpec
}

export function getUnmatchedSingleSlotFixtures(
  deckConfigProtocolSpec: CutoutConfigAndCompatibility[]
): CutoutConfigAndCompatibility[] {
  const singleSlotDeckConfigCompatibility = deckConfigProtocolSpec.filter(
    ({ requiredAddressableAreas }) =>
      // required AA list includes only single-slot AA
      requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      )
  )
  // fixture includes at least 1 required AA
  const unmatchedSingleSlotDeckConfigCompatibility = singleSlotDeckConfigCompatibility.filter(
    ({ cutoutFixtureId, compatibleCutoutFixtureIds }) =>
      !isMatchedFixture(cutoutFixtureId, compatibleCutoutFixtureIds)
  )

  return unmatchedSingleSlotDeckConfigCompatibility
}

export function getIsFixtureMismatch(
  deckConfigProtocolSpec: CutoutConfigAndCompatibility[]
): boolean {
  const isFixtureMismatch = !deckConfigProtocolSpec.every(
    ({ cutoutFixtureId, compatibleCutoutFixtureIds }) =>
      isMatchedFixture(cutoutFixtureId, compatibleCutoutFixtureIds)
  )
  return isFixtureMismatch
}

function isMatchedFixture(
  cutoutFixtureId: CutoutFixtureId | null,
  compatibleCutoutFixtureIds: CutoutFixtureId[]
): boolean {
  return (
    cutoutFixtureId == null ||
    compatibleCutoutFixtureIds.includes(cutoutFixtureId)
  )
}
