import { getSlotDisplayNameFromAAWithFakes } from './getVisualSlotFrom'

import type { CutoutFixtureId, CutoutId } from '../../../deck'
import type { DeckDefinition } from '../../types'

/**
 * Visual slot labels for a cutout fixture mounted on a cutout, joined with " + "
 * when the fixture spans multiple slots on one cutout (e.g. vacuum module A3 + A4).
 *
 * Values come from `providesAddressableAreas` on the deck definition fixture.
 */
export function getJoinedVisualSlotDisplayNamesForFixture(
  deckDef: DeckDefinition,
  cutoutFixtureId: CutoutFixtureId,
  cutoutId: CutoutId
): string {
  const fixtureDef = deckDef.cutoutFixtures.find(
    cf => cf.id === cutoutFixtureId
  )
  const areaIds = fixtureDef?.providesAddressableAreas[cutoutId] ?? []
  return areaIds
    .map(aaId => getSlotDisplayNameFromAAWithFakes(aaId))
    .join(' + ')
}
