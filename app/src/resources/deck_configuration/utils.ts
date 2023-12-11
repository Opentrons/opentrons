import { FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import type {
  CutoutConfigProtocolSpec,
  CutoutFixtureId,
} from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from './hooks'

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
