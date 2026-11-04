import isEqual from 'lodash/isEqual'

import { getCutoutIdForSlotName, getDeckDefFromRobotType } from '..'
import {
  ABSORBANCE_READER_V1_FIXTURE,
  COMBO_FIXTURE_TO_FIXTURE_MAP,
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE,
  FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE,
  FLEX_MODULE_AA_TYPE_BY_MODEL,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_USB_MODULE_FIXTURES,
  MAGNETIC_BLOCK_V1,
  MODULE_FIXTURES_BY_MODEL,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  VACUUM_MODULE_V1_FIXTURE,
  WASTE_CHUTE_FIXTURES,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
  WASTE_CHUTE_WITH_FAKE_FIXTURES,
} from '../../constants'
import { getAAByAAId, getVisualSlotIdForAA } from '../../fixtures'
import {
  getAAsToFixtureIdFromDeckDefWithFakes,
  getAAWithFakesFromCutoutFixtureId,
} from './getAddressableAreaFrom'
import { getAAWithFakesFromVSId } from './getVisualSlotFrom'

import type {
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
} from '../../../deck'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
} from '../../constants'
import type {
  AreaType,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixture,
  DeckDefinition,
  ModuleModel,
} from '../../types'
import type { VISUAL_SLOTS } from './getVisualSlotFrom'

export const getCutoutFixtureReplacementIfNeeded = (
  cutoutFixtureId: CutoutFixtureId,
  cutoutId: CutoutId,
  deckDefinition: DeckDefinition
): CutoutFixtureIdsWithFakes => {
  if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
    if (
      cutoutFixtureId === SINGLE_RIGHT_SLOT_FIXTURE &&
      deckDefinition.robot.model === FLEX_ROBOT_TYPE
    ) {
      return FAKE_STAGING_AREA_RIGHT_SLOT
    } else if (
      cutoutFixtureId === WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE &&
      deckDefinition.robot.model === FLEX_ROBOT_TYPE
    ) {
      return FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE
    } else if (cutoutFixtureId === MAGNETIC_BLOCK_V1) {
      return 'fakeStagingSlotWithMagBlockV1'
    }
  }
  return cutoutFixtureId
}

export const getReplacementFixtureForFixtureRemoval = (
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  cutoutId: CutoutId,
  addressableAreaId?: AddressableAreaNamesWithFakes // nullable for PD
): CutoutFixtureId => {
  if (cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
    return SINGLE_RIGHT_SLOT_FIXTURE
  } else if (addressableAreaId && SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
    const cutoutFixtureReplacment = replaceCutoutFixtureForFixtureRemoval(
      cutoutFixtureId,
      cutoutId,
      addressableAreaId
    )
    return getReplacementFixtureForFakeFixture(cutoutFixtureReplacment)
  } else if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
    return SINGLE_RIGHT_SLOT_FIXTURE
  } else if (SINGLE_LEFT_CUTOUTS.includes(cutoutId)) {
    return SINGLE_LEFT_SLOT_FIXTURE
  }
  return SINGLE_CENTER_SLOT_FIXTURE
}

/**
 * Given a fake cutout fixutre find a replacment to store on the server
 * @param cutoutFixtureId: a cutoutId we wish to replace with a non fake fixture
 * @returns the relevant cutoutFixtureId to store on the server
 */
export const getReplacementFixtureForFakeFixture = (
  cutoutFixtureId: CutoutFixtureIdsWithFakes
): CutoutFixtureId => {
  if (cutoutFixtureId === FAKE_STAGING_AREA_RIGHT_SLOT) {
    return SINGLE_RIGHT_SLOT_FIXTURE
  }
  if (cutoutFixtureId === FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE) {
    return WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
  }
  if (cutoutFixtureId === FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE) {
    return MAGNETIC_BLOCK_V1
  }
  return cutoutFixtureId
}
/**
 * Given a list of cutout configs replace fixtures with their fake fixtures
 * @param: a list of cutout config from the server
 * @returns: a list of cutout config with relevant AA
 */
export const replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA = (
  cutoutFixtures: CutoutConfig[]
): CutoutConfigMap[] => {
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  return cutoutFixtures.reduce<CutoutConfigMap[]>((acc, obj) => {
    const cutoutFixtureReplacment = getCutoutFixtureReplacementIfNeeded(
      obj.cutoutFixtureId,
      obj.cutoutId,
      deckDef
    )
    const aaPerCutoutFixture = getAAWithFakesFromCutoutFixtureId(
      obj.cutoutId,
      cutoutFixtureReplacment ?? obj.cutoutFixtureId,
      deckDef
    )

    if (WASTE_CHUTE_FIXTURES.includes(obj.cutoutFixtureId)) {
      acc.push({
        ...obj,
        addressableAreaId: DEFAULT_AA_FOR_WASTE_CHUTE,
        cutoutFixtureId: cutoutFixtureReplacment,
      })
      const otherWasteChuteAA = aaPerCutoutFixture?.find(
        aa => getAAByAAId(aa, deckDef).areaType !== 'wasteChute'
      )
      if (otherWasteChuteAA != null) {
        acc.push({
          ...obj,
          addressableAreaId: otherWasteChuteAA,
          cutoutFixtureId: cutoutFixtureReplacment,
        })
      }
    } else if (obj.cutoutFixtureId === ABSORBANCE_READER_V1_FIXTURE) {
      const absorbanceReaderAA = aaPerCutoutFixture?.find(
        aa => getAAByAAId(aa, deckDef).areaType === 'absorbanceReader'
      )
      if (absorbanceReaderAA != null) {
        acc.push({
          ...obj,
          addressableAreaId: absorbanceReaderAA,
          cutoutFixtureId: cutoutFixtureReplacment,
        })
      }
    } else if (obj.cutoutFixtureId === VACUUM_MODULE_V1_FIXTURE) {
      const vacuumModuleAA = aaPerCutoutFixture?.find(
        aa => getAAByAAId(aa, deckDef).areaType === 'vacuumModule'
      )
      if (vacuumModuleAA != null) {
        acc.push({
          ...obj,
          addressableAreaId: vacuumModuleAA,
          cutoutFixtureId: cutoutFixtureReplacment,
        })
      }
    } else {
      aaPerCutoutFixture?.forEach(item => {
        acc.push({
          ...obj,
          addressableAreaId: item,
          cutoutFixtureId: cutoutFixtureReplacment,
        })
      })
    }
    return acc
  }, [])
}

/**
 * Given a cutout fixture to remove find what fixture to use instead
 * @param cutoutFixtureRemoved: fixtures to remove
 * @param cutoutId
 * @param addressableAreaId to remove from fixture
 * @returns fixture to replace with
 */
export const replaceCutoutFixtureForFixtureRemoval = (
  cutoutFixtureRemoved: CutoutFixtureIdsWithFakes,
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutFixtureIdsWithFakes => {
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const aaPerFixtureOptions = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    deckDef
  )
  const aaForFixtureRemoval = getAAWithFakesFromCutoutFixtureId(
    cutoutId,
    cutoutFixtureRemoved,
    deckDef
  )
  if (WASTE_CHUTE_WITH_FAKE_FIXTURES.includes(cutoutFixtureRemoved)) {
    if (addressableAreaId === DEFAULT_AA_FOR_WASTE_CHUTE) {
      if (WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(cutoutFixtureRemoved)) {
        return FLEX_STACKER_V1_FIXTURE
      } else if (
        WASTE_CHUTE_STAGING_AREA_FIXTURES.includes(
          cutoutFixtureRemoved as CutoutFixtureId
        )
      ) {
        return STAGING_AREA_RIGHT_SLOT_FIXTURE
      }
      return SINGLE_RIGHT_SLOT_FIXTURE
    } else {
      return WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
    }
  } else if (cutoutFixtureRemoved === ABSORBANCE_READER_V1_FIXTURE) {
    return SINGLE_RIGHT_SLOT_FIXTURE
  } else if (cutoutFixtureRemoved === VACUUM_MODULE_V1_FIXTURE) {
    // Vacuum spans two AAs on one cutout; the generic matcher below cannot
    // resolve to singleRightSlot (only provides A3), so removal must be explicit.
    return SINGLE_RIGHT_SLOT_FIXTURE
  } else if (cutoutFixtureRemoved === FLEX_STACKER_V1_FIXTURE) {
    return SINGLE_RIGHT_SLOT_FIXTURE
  } else if (cutoutFixtureRemoved === FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE) {
    if (getAAByAAId(addressableAreaId, deckDef).areaType === 'flexStacker') {
      return FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE
    } else {
      return FLEX_STACKER_V1_FIXTURE
    }
  } else {
    const updated = aaForFixtureRemoval?.map(aa => {
      const vsId = getVisualSlotIdForAA(cutoutId, cutoutFixtureRemoved, aa)
      return aa === addressableAreaId
        ? getAAWithFakesFromVSId(vsId as VISUAL_SLOTS)
        : aa
    })
    const match = Object.entries(aaPerFixtureOptions).find(([, value]) => {
      return isEqual(
        value.sort(),
        WASTE_CHUTE_WITH_FAKE_FIXTURES.includes(cutoutFixtureRemoved)
          ? aaForFixtureRemoval?.sort()
          : updated?.sort()
      )
    })
    if (match) {
      return match[0] as CutoutFixtureIdsWithFakes
    }
    // Fallback if no match found
    return cutoutFixtureRemoved
  }
}

export function getCutoutFixtureIdsForModuleModel(
  moduleModel: ModuleModel
): CutoutFixtureId[] {
  const moduleFixtures = MODULE_FIXTURES_BY_MODEL[moduleModel]
  return moduleFixtures ?? []
}

export function getModuleModelFromFixtureId(
  fixtureId: CutoutFixtureId
): ModuleModel | null {
  for (const [moduleModel, fixtureIds] of Object.entries(
    MODULE_FIXTURES_BY_MODEL
  )) {
    if (fixtureIds?.includes(fixtureId)) {
      return moduleModel as ModuleModel
    }
  }
  return null
}

/**
 * Returns true if the fixture is a module fixture, including when the fixture
 * is a combo fixture that contains a module (e.g. flex stacker + waste chute).
 */
export function isModuleFixtureId(fixtureId: CutoutFixtureId): boolean {
  const componentFixtureIds = COMBO_FIXTURE_TO_FIXTURE_MAP[fixtureId] ?? [
    fixtureId,
  ]
  return componentFixtureIds.some(
    id => getModuleModelFromFixtureId(id as CutoutFixtureId) !== null
  )
}

/**
 * Given a list of fixture IDs, find the combo fixture that contains all of them.
 * @param fixtureIds - Array of fixture IDs to find a combo for
 * @returns The combo fixture ID if found, null otherwise
 */
export function getComboFixtureFromFixtureIds(
  fixtureIds: CutoutFixtureIdsWithFakes[]
): CutoutFixtureId | null {
  for (const [comboFixtureId, componentFixtures] of Object.entries(
    COMBO_FIXTURE_TO_FIXTURE_MAP
  )) {
    if (componentFixtures == null) continue
    // Check same length and that both arrays contain exactly the same set (all components present)
    const allMatch =
      fixtureIds.length === componentFixtures.length &&
      fixtureIds.every(fixtureId => componentFixtures.includes(fixtureId)) &&
      componentFixtures.every(cf => fixtureIds.includes(cf))
    if (allMatch) {
      return comboFixtureId as CutoutFixtureId
    }
  }
  return null
}

export function getCutoutFixturesForModuleModel(
  moduleModel: ModuleModel,
  deckDef: DeckDefinition
): CutoutFixture[] {
  const moduleFixtureIds = getCutoutFixtureIdsForModuleModel(moduleModel)
  return moduleFixtureIds.reduce<CutoutFixture[]>((acc, id) => {
    const moduleFixture = deckDef.cutoutFixtures.find(cf => cf.id === id)
    return moduleFixture != null ? [...acc, moduleFixture] : acc
  }, [])
}

export function getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
  anchorCutoutId: CutoutId | null,
  moduleFixtures: CutoutFixture[] // cutout fixtures for a specific module model
): { [cutoutId in CutoutId]?: CutoutFixtureId } {
  // find the first fixture for this specific module model that may mount to the cutout implied by the slotName
  const anchorFixture = moduleFixtures.find(fixture =>
    fixture.mayMountTo.some(cutoutId => cutoutId === anchorCutoutId)
  )
  if (anchorCutoutId != null && anchorFixture != null) {
    const groupedFixtures = anchorFixture.fixtureGroup[anchorCutoutId]
    return groupedFixtures?.[0] ?? { [anchorCutoutId]: anchorFixture.id }
  }
  return {}
}

export function getFixtureIdByCutoutIdFromModuleSlotName(
  slotName: string,
  moduleFixtures: CutoutFixture[], // cutout fixtures for a specific module model
  deckDef: DeckDefinition
): { [cutoutId in CutoutId]?: CutoutFixtureId } {
  const anchorCutoutId = getCutoutIdForSlotName(slotName, deckDef)
  return getFixtureIdByCutoutIdFromModuleAnchorCutoutId(
    anchorCutoutId,
    moduleFixtures
  )
}

export const getMainUsbModuleFixtureIdForComboFixture = (
  compatibleCutoutFixtureIds: CutoutFixtureId[]
): CutoutFixtureId | null => {
  return (
    compatibleCutoutFixtureIds.find(cf =>
      FLEX_USB_MODULE_FIXTURES.includes(cf)
    ) ?? null
  )
}

export const getMainFixtureIdForAA = (
  compatibleCutoutFixtureIds: CutoutFixtureId[],
  addressableAreaIds: AddressableAreaName[],
  cutoutId: CutoutId
): CutoutFixtureId | null => {
  if (addressableAreaIds.length === 1) {
    return getMainNonComboFixtureId(
      compatibleCutoutFixtureIds,
      addressableAreaIds,
      cutoutId
    )
  }

  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const cutoutFixtures = deckDef.cutoutFixtures.filter(cf =>
    compatibleCutoutFixtureIds.includes(cf.id)
  )
  const cutoutFixturesWithAddressableAreas = cutoutFixtures.find(cf =>
    Object.values(cf.providesAddressableAreas).some(providedAAs =>
      addressableAreaIds.every(aa => providedAAs.includes(aa))
    )
  )
  return cutoutFixturesWithAddressableAreas?.id ?? null
}

export const getMainNonComboFixtureId = (
  compatibleCutoutFixtureIds: CutoutFixtureId[],
  addressableAreaIds: AddressableAreaName[],
  cutoutId: CutoutId
): CutoutFixtureId | null => {
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const cutoutFixtures = deckDef.cutoutFixtures.filter(cf =>
    compatibleCutoutFixtureIds.includes(cf.id)
  )
  const aaAreaType = getAAByAAId(addressableAreaIds[0], deckDef).areaType
  if (
    Object.values(FLEX_MODULE_AA_TYPE_BY_MODEL).includes(
      aaAreaType as AreaType
    ) &&
    aaAreaType !== 'magneticBlock'
  ) {
    return (
      getMainUsbModuleFixtureIdForComboFixture(compatibleCutoutFixtureIds) ??
      null
    )
  }
  const cutoutFixturesWithAddressableAreas = cutoutFixtures.filter(cf =>
    Object.values(cf.providesAddressableAreas).some(providedAAs =>
      addressableAreaIds.every(aa => providedAAs.includes(aa))
    )
  )

  if (cutoutFixturesWithAddressableAreas.length === 0) {
    return null
  }

  // Find the fixture with the least items in its providesAddressableAreas in order to find the simplest fixture
  const fixtureWithLeastAAs = cutoutFixturesWithAddressableAreas.reduce(
    (minFixture, currentFixture) => {
      const minAAsCount = Object.entries(minFixture.providesAddressableAreas)
        .filter(([key, value]) => key === cutoutId)
        .map(([key, value]) => value)[0].length
      const currentAAsCount = Object.entries(
        currentFixture.providesAddressableAreas
      )
        .filter(([key, value]) => key === cutoutId)
        .map(([key, value]) => value)[0].length
      return currentAAsCount < minAAsCount ? currentFixture : minFixture
    }
  )
  return fixtureWithLeastAAs.id
}
