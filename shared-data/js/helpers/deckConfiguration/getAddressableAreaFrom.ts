import { FAKE_FIXTURES_AND_AA } from '../../fixtures'

import type { CutoutId } from '../../../deck'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
} from '../../constants'
import type { DeckDefinition } from '../../types'

/**
 * Given a cutoutId and a cutoutFixtureId, returns a list of AA, null if there is none
 */
export const getAAWithFakesFromCutoutFixtureId = (
  inputCutoutId: CutoutId,
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  deckDefinition: DeckDefinition
): AddressableAreaNamesWithFakes[] | null => {
  const cutoutFixturesWithFakeFixtures = [
    ...deckDefinition.cutoutFixtures,
    ...FAKE_FIXTURES_AND_AA.cutoutFixtures,
  ]
  const deckDefWithFakeCutoutFixtures = {
    ...deckDefinition,
    cutoutFixtures: cutoutFixturesWithFakeFixtures,
  }
  const cutoutFixture = deckDefWithFakeCutoutFixtures.cutoutFixtures.find(
    fixture => fixture.id === cutoutFixtureId
  )
  if (cutoutFixture == null) {
    console.error(`Cannot find get addressable areas for ${cutoutFixtureId}`)
    return null
  }
  return cutoutFixture?.providesAddressableAreas[inputCutoutId]
}
