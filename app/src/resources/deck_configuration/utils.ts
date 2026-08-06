import {
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  FLEX_STACKER_ADDRESSABLE_AREAS,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_USB_MODULE_ADDRESSABLE_AREAS,
  MAGNETIC_BLOCK_ADDRESSABLE_AREAS,
  MAGNETIC_BLOCK_FIXTURES,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import type {
  CutoutConfigAndCompatibility,
  CutoutFixtureId,
} from '@opentrons/shared-data'

// filter down the list of current deck configuration cutouts to include
// only those that must provide addressable areas for the protocol
// exclude single slot fixtures unless they are missing from deck config
export function getRequiredDeckConfig(
  deckConfigProtocolSpec: CutoutConfigAndCompatibility[]
): CutoutConfigAndCompatibility[] {
  return deckConfigProtocolSpec.filter(fixture => {
    const isSingleSlotFixture = fixture.requiredAddressableAreas.every(aa =>
      FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
    )
    const hasMissingSingleSlotFixture =
      isSingleSlotFixture &&
      !isMatchedFixture(
        fixture.cutoutFixtureId,
        fixture.compatibleCutoutFixtureIds
      )

    return (
      fixture.requiredAddressableAreas.length > 0 &&
      (!isSingleSlotFixture || hasMissingSingleSlotFixture)
    )
  })
}

export function getIsFixtureMismatch(
  deckConfigProtocolSpec: CutoutConfigAndCompatibility[]
): boolean {
  const isFixtureMismatch = !deckConfigProtocolSpec.every(
    ({ cutoutFixtureId, compatibleCutoutFixtureIds }) => {
      return isMatchedFixture(cutoutFixtureId, compatibleCutoutFixtureIds)
    }
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

interface CutoutConfigAndCompatibilityWithPartial extends CutoutConfigAndCompatibility {
  partialRequiredCutoutFixtureId?: CutoutFixtureId
}

export const getFilteredDeckConfigFixtureCompatibility = (
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
): CutoutConfigAndCompatibilityWithPartial[] => {
  // if both A1 and B1 need to be empty but the thermocycler is attached, only
  // show a conflict for A1 to avoid redundancy
  const hasTwoLabwareThermocyclerConflicts =
    deckConfigCompatibility.some(
      ({ cutoutFixtureId, compatibleCutoutFixtureIds }) =>
        cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE &&
        compatibleCutoutFixtureIds.some(fixtureId =>
          SINGLE_SLOT_FIXTURES.includes(fixtureId)
        )
    ) &&
    deckConfigCompatibility.some(
      ({ cutoutFixtureId, compatibleCutoutFixtureIds }) =>
        cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE &&
        compatibleCutoutFixtureIds.some(fixtureId =>
          SINGLE_SLOT_FIXTURES.includes(fixtureId)
        )
    )
  return deckConfigCompatibility
    .filter(({ cutoutFixtureId }) => {
      return (
        !hasTwoLabwareThermocyclerConflicts ||
        !(cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE)
      )
    })
    .reduce<CutoutConfigAndCompatibilityWithPartial[]>(
      (acc, compatabilityItem) => {
        // filter out all fixtures that only provide usb module addressable areas
        // (i.e. everything but MagBlockV1 and StagingAreaWithMagBlockV1)
        // as they're handled in the Modules Table
        if (
          compatabilityItem.requiredAddressableAreas.every(raa =>
            FLEX_USB_MODULE_ADDRESSABLE_AREAS.includes(raa)
          ) ||
          (compatabilityItem.requiredAddressableAreas.some(raa =>
            FLEX_STACKER_ADDRESSABLE_AREAS.includes(raa)
          ) &&
            !compatabilityItem.requiredAddressableAreas.some(raa =>
              MAGNETIC_BLOCK_ADDRESSABLE_AREAS.includes(raa)
            ) &&
            !compatabilityItem.requiredAddressableAreas.some(raa =>
              FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(raa)
            ))
        ) {
          return acc
        }
        // if there is a magnetic block combination fixture, separate it out
        // and show two line items in the table
        if (
          compatabilityItem.compatibleCutoutFixtureIds.every(fixtureId =>
            MAGNETIC_BLOCK_FIXTURES.includes(fixtureId)
          )
        ) {
          const magBlockRequirement = {
            ...compatabilityItem,
            partialRequiredCutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
          }
          acc.push(magBlockRequirement)
          if (
            compatabilityItem.compatibleCutoutFixtureIds.length === 1 &&
            compatabilityItem.compatibleCutoutFixtureIds[0] ===
              STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
          ) {
            const stagingAreaRequirement = {
              ...compatabilityItem,
              partialRequiredCutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
            }
            acc.push(stagingAreaRequirement)
          }
          return acc
        } else if (
          compatabilityItem.requiredAddressableAreas.some(
            raa =>
              FLEX_STACKER_ADDRESSABLE_AREAS.includes(raa) &&
              compatabilityItem.requiredAddressableAreas.some(raa =>
                FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(raa)
              )
          )
        ) {
          const rightSlotRequirement = {
            ...compatabilityItem,
            partialRequiredCutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
          }
          if (
            compatabilityItem.cutoutFixtureId !== FLEX_STACKER_V1_FIXTURE &&
            compatabilityItem.cutoutFixtureId !== SINGLE_RIGHT_SLOT_FIXTURE
          ) {
            acc.push(rightSlotRequirement)
          }
          return acc
        } else {
          acc.push(compatabilityItem)
          return acc
        }
      },
      []
    )
}

/**
 * This function determines if the currently configured fixture is compatible
 * with the required fixture for a protocol
 * @param cutoutFixtureId: currently configured fixtureId
 * @param compatibleCutoutFixtureIds: array of fixtureIds that are compatible for this cutout in the protocol
 * @param partialRequiredCutoutFixtureId: required fixtureId that may fulfill a subset of the requirement for
 * one of the compatible cutout fixtureIds
 * @returns boolean indicating if the current fixture conflicts with the required fixture
 */
export const isFixtureCompatible = (
  cutoutFixtureId: CutoutFixtureId,
  compatibleCutoutFixtureIds: CutoutFixtureId[],
  partialRequiredCutoutFixtureId?: CutoutFixtureId
): boolean => {
  if (partialRequiredCutoutFixtureId === MAGNETIC_BLOCK_V1_FIXTURE) {
    return MAGNETIC_BLOCK_FIXTURES.includes(cutoutFixtureId)
  } else if (
    partialRequiredCutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  ) {
    return STAGING_AREA_FIXTURES.includes(cutoutFixtureId)
  } else {
    return (
      cutoutFixtureId != null &&
      compatibleCutoutFixtureIds.includes(cutoutFixtureId)
    )
  }
}

/**
 * Assuming the current fixture is not compatible, this function checks if there
 * is a conflicting fixture configured, or if the fixture is just missing.
 * @param cutoutFixtureId: currently configured fixtureId
 * @param partialRequiredCutoutFixtureId: required fixtureId that may be able to coexist with
 * a non-single slot fixture in the same cutout
 * @returns boolean indicating if the current fixture conflicts with the required fixture
 */
export const isConflictingFixtureConfigured = (
  cutoutFixtureId: CutoutFixtureId,
  partialRequiredCutoutFixtureId?: CutoutFixtureId
): boolean => {
  if (partialRequiredCutoutFixtureId === MAGNETIC_BLOCK_V1_FIXTURE) {
    return (
      !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) &&
      cutoutFixtureId !== STAGING_AREA_RIGHT_SLOT_FIXTURE &&
      cutoutFixtureId !== FLEX_STACKER_V1_FIXTURE
    )
  } else if (
    partialRequiredCutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  ) {
    return (
      !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) &&
      cutoutFixtureId !== MAGNETIC_BLOCK_V1_FIXTURE
    )
  } else {
    return (
      cutoutFixtureId != null && !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
    )
  }
}
