import { FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS } from '@opentrons/shared-data'

import type { CutoutFixtureId } from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from './hooks'

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
