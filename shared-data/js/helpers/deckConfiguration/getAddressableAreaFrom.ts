import { getDeckDefFromRobotType } from '../..'
import {
  A1_ADDRESSABLE_AREA,
  COMBO_FIXTURES,
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FLEX_MODULE_AA_TYPE_BY_MODEL,
  FLEX_ROBOT_TYPE,
  LEFT_AND_CENTER_CUTOUTS,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '../../constants'
import {
  FAKE_FIXTURES_AND_AA,
  getAAByAAId,
  getDeckDefWithFakes,
} from '../../fixtures'
import {
  getAAWithFakesFromVSId,
  getVisualSlotIdFromAAId,
} from './getVisualSlotFrom'

import type { CutoutFixtureId, CutoutId } from '../../../deck'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
} from '../../constants'
import type { DeckDefinition, ModuleModel } from '../../types'

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

/**
 * Given a cutout id get a key value pair of all possibilities for fixture id and related AA
 * @param addedCutoutConfigs: fixtures list selected to add to deck
 * @param cutoutId: cutout if we are adding a fixture to.
 * @returns key value pair of of all possibilities for fixture id and related AA
 */
export const getAAsToFixtureIdFromDeckDefWithFakes = (
  cutoutId: CutoutId,
  deckDef: DeckDefinition
): Record<CutoutFixtureIdsWithFakes, AddressableAreaNamesWithFakes[]> => {
  const deckDefWithFakes = getDeckDefWithFakes(deckDef)
  // replace staging area aaId to fake ones
  const availableCutoutFixtuers = deckDefWithFakes.cutoutFixtures.filter(cf =>
    cf.mayMountTo.includes(cutoutId)
  )
  const aaForCutoutFixrure = availableCutoutFixtuers.reduce<
    Partial<Record<CutoutFixtureIdsWithFakes, AddressableAreaNamesWithFakes[]>>
  >((acc, { id, providesAddressableAreas }) => {
    acc[id] = providesAddressableAreas[cutoutId]
    return acc
  }, {})
  return aaForCutoutFixrure as Record<
    CutoutFixtureIdsWithFakes,
    AddressableAreaNamesWithFakes[]
  >
}

export const getAAForModuleFixture = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureIdsWithFakes,
  moduleModel: ModuleModel
): AddressableAreaNamesWithFakes => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const aaList = getAAWithFakesFromCutoutFixtureId(cutoutId, fixtureId, deckDef)
  const aa = aaList?.find(
    aa =>
      getAAByAAId(aa, deckDef).areaType ===
      FLEX_MODULE_AA_TYPE_BY_MODEL[moduleModel]
  )
  if (!aa) {
    console.error(
      `Was not able to find a aa match for module ${moduleModel} in cutout ${cutoutId}`
    )
    return A1_ADDRESSABLE_AREA
  }
  return aa
}

/**
 * get relevent aa name that match with cutoutId and fixtureId.
 *
 * @param cutoutId - The cutoutId we are looking for.
 * @param fixtureId - The fixtureId we are looking for.
 * @returns The aa name or null if not match found.
 */
export const getMainAAForAFixture = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureId,
  addressableAreaId: AddressableAreaNamesWithFakes,
  existingCutoutFixtureId?: CutoutFixtureIdsWithFakes
): AddressableAreaNamesWithFakes | null => {
  const addressableAreasByFixtureId = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    getDeckDefFromRobotType('OT-3 Standard')
  )
  const aaListForFixtureId = addressableAreasByFixtureId[fixtureId] ?? []
  if (LEFT_AND_CENTER_CUTOUTS.includes(cutoutId)) {
    return aaListForFixtureId[0]
  } else if (WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE === fixtureId) {
    return DEFAULT_AA_FOR_WASTE_CHUTE
  } else if (fixtureId === TRASH_BIN_ADAPTER_FIXTURE) {
    if (
      existingCutoutFixtureId &&
      COMBO_FIXTURES.includes(existingCutoutFixtureId)
    ) {
      return null
    } else {
      return aaListForFixtureId[0]
    }
  } else {
    const aa = aaListForFixtureId.find((aa: AddressableAreaNamesWithFakes) => {
      const vsId = getVisualSlotIdFromAAId(aa)
      const singleSlotId = getAAWithFakesFromVSId(vsId)
      return singleSlotId === addressableAreaId
    })
    return aa! // we can cast this bc there should me a match for every fixtureId
  }
}
