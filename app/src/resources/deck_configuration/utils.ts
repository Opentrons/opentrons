import { FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import type { CutoutFixtureId } from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from './hooks'

export function getRequiredDeckConfig(
  deckConfigProtocolSpec: CutoutConfigAndCompatibility[]
): CutoutConfigAndCompatibility[] {
  const nonSingleSlotDeckConfigCompatibility = deckConfigProtocolSpec.filter(
    ({ missingLabwareDisplayName, requiredAddressableAreas }) =>
      // required AA list includes a non-single-slot AA or a missing labware display name
      !requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      ) || missingLabwareDisplayName != null
  )
  // fixture includes at least 1 required AA
  const requiredDeckConfigProtocolSpec = nonSingleSlotDeckConfigCompatibility.filter(
    fixture => fixture.requiredAddressableAreas.length > 0
  )

  return requiredDeckConfigProtocolSpec
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
