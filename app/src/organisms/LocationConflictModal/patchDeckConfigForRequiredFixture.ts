import {
  FLEX_STACKER_FIXTURES,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  getAAWithFakesFromCutoutFixtureId,
  getDeckDefFromRobotType,
  getMainFixtureIdForAA,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import type {
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
} from '@opentrons/shared-data'

/**
 * Given the current deck config, current cutoutId, and required fixtureId
 * for that cutout in a given protocol this function will return an updated deck config
 * with that patches the fixture at the provided cutoutId
 * @param deckConfig: current deck configuration
 * @param requiredFixtureId: the required fixtureId for a protocol for a given item in the
 * protocol setup deck hardware section
 * @param cutoutId: the cutoutId for the required fixture
 * @returns updated deck configuration
 */

export const patchDeckConfigForRequiredFixture = (
  deckConfig: DeckConfiguration,
  cutoutId: CutoutId,
  requiredFixtureId: CutoutFixtureId,
  compatibleCutoutFixtureIds: CutoutFixtureId[],

): DeckConfiguration => {
  const newDeckConfig = deckConfig.map(fixture => {
    if (fixture.cutoutId === cutoutId) {
      const deckDef = getDeckDefFromRobotType('OT-3 Standard')
      if(SINGLE_RIGHT_SLOT_FIXTURE.includes(cutoutId)){
        console.log("patch!")
        const requiredAA = getAAWithFakesFromCutoutFixtureId(
          cutoutId,
          requiredFixtureId,
          deckDef
        )
        const currentAA = getAAWithFakesFromCutoutFixtureId(
          cutoutId,
          fixture.cutoutFixtureId,
          deckDef
        )
        const requiredAddressableAreas = [
          ...(requiredAA ?? []),
          ...(currentAA ?? []),
        ]
        const newMatchWithAA = getMainFixtureIdForAA(compatibleCutoutFixtureIds,
          requiredAddressableAreas as AddressableAreaName[],
          cutoutId
        )
        console.log("new MatchWithAA: ", newMatchWithAA)
        if(newMatchWithAA != null){
        return {
          ...fixture,
          cutoutFixtureId: newMatchWithAA,
        }
      }
      }

      if (
        requiredFixtureId === MAGNETIC_BLOCK_V1_FIXTURE &&
        fixture.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
      ) {
        return {
          ...fixture,
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
        }
      } else if (
        requiredFixtureId === MAGNETIC_BLOCK_V1_FIXTURE &&
        fixture.cutoutFixtureId === FLEX_STACKER_V1_FIXTURE
      ) {
        return {
          ...fixture,
          cutoutFixtureId: FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
        }
      } else if (
        requiredFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE &&
        fixture.cutoutFixtureId === MAGNETIC_BLOCK_V1_FIXTURE
      ) {
        return {
          ...fixture,
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
        }
      } else if (
        FLEX_STACKER_FIXTURES.includes(requiredFixtureId) &&
        FLEX_STACKER_FIXTURES.includes(fixture.cutoutFixtureId)
      ) {
        // maintain module serial number in this case only, where stacker is already
        // configured and we need to patch with a combo fixture
        return { ...fixture, cutoutFixtureId: requiredFixtureId }
      } else {
        return {
          ...fixture,
          opentronsModuleSerialNumber: undefined,
          cutoutFixtureId: requiredFixtureId,
        }
      }
    } else if (
      (fixture.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
        fixture.cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE) &&
      ((cutoutId === 'cutoutA1' && fixture.cutoutId === 'cutoutB1') ||
        (cutoutId === 'cutoutB1' && fixture.cutoutId === 'cutoutA1'))
    ) {
      // special case for removing thermocycler, set the slot without a conflict
      // to be a single slot fixture
      return {
        ...fixture,
        cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
        opentronsModuleSerialNumber: undefined,
      }
    }
    return fixture
  })
  return newDeckConfig
}
