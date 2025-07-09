import isEqual from 'lodash/isEqual'

import {
  FLEX_STACKER_FIXTURES,
  FLEX_STAGING_ADDRESSABLE_AREAS_WITH_FAKES,
  MODULE_AA_TYPE_BY_MODEL,
  WASTE_CHUTE_FIXTURES,
  WASTE_CHUTE_WITH_FAKE_FIXTURES,
} from '.'
import {
  A1_ADDRESSABLE_AREA,
  A2_ADDRESSABLE_AREA,
  A3_ADDRESSABLE_AREA,
  ABSORBANCE_READER_V1,
  ABSORBANCE_READER_V1_FIXTURE,
  ADDRESSABLE_AREA_1,
  ADDRESSABLE_AREA_2,
  ADDRESSABLE_AREA_3,
  ADDRESSABLE_AREA_4,
  ADDRESSABLE_AREA_5,
  ADDRESSABLE_AREA_6,
  ADDRESSABLE_AREA_7,
  ADDRESSABLE_AREA_8,
  ADDRESSABLE_AREA_9,
  ADDRESSABLE_AREA_10,
  ADDRESSABLE_AREA_11,
  B1_ADDRESSABLE_AREA,
  B2_ADDRESSABLE_AREA,
  B3_ADDRESSABLE_AREA,
  C1_ADDRESSABLE_AREA,
  C2_ADDRESSABLE_AREA,
  C3_ADDRESSABLE_AREA,
  D1_ADDRESSABLE_AREA,
  D2_ADDRESSABLE_AREA,
  D3_ADDRESSABLE_AREA,
  DEFAULT_AA_FOR_WASTE_CHUTE,
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FAKE_STAGING_SLOT_WITH_MAG_BLOCK,
  FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  LEFT_AND_CENTER_CUTOUTS,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MODULE_FIXTURES_BY_MODEL,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from './constants'
import { getCutoutIdForSlotName, getDeckDefFromRobotType } from './helpers'
import { getModuleDisplayName } from './modules'

import type { TFunction } from 'i18next'
import type { ModuleLocation } from '../command'
import type {
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
  OT2CutoutId,
} from '../deck'
import type {
  AddressableAreaNamesWithFakes,
  AddressableAreaWithFakes,
  AreaTypeWithFakes,
  CutoutFixtureIdsWithFakes,
} from './constants'
import type {
  AddressableArea,
  CoordinateTuple,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixture,
  DeckDefinition,
  DeckDefinitionWithFakes,
  ModuleModel,
} from './types'

export function getCutoutDisplayName(cutout: CutoutId): string {
  return cutout.replace('cutout', '')
}

export function getAADisplayName(
  aadressableAreaId: AddressableAreaNamesWithFakes
): string {
  return getAAByAAId(
    aadressableAreaId,
    getDeckDefFromRobotType('OT-3 Standard')
  ).displayName
}

// mapping of OT-2 deck slots to cutouts
export const OT2_CUTOUT_BY_SLOT_ID: { [slotId: string]: OT2CutoutId } = {
  1: 'cutout1',
  2: 'cutout2',
  3: 'cutout3',
  4: 'cutout4',
  5: 'cutout5',
  6: 'cutout6',
  7: 'cutout7',
  8: 'cutout8',
  9: 'cutout9',
  10: 'cutout10',
  11: 'cutout11',
  fixedTrash: 'cutout12',
}

// mapping of Flex deck slots to cutouts
export const FLEX_CUTOUT_BY_SLOT_ID: { [slotId: string]: CutoutId } = {
  A1: 'cutoutA1',
  A2: 'cutoutA2',
  A3: 'cutoutA3',
  A4: 'cutoutA3',
  B1: 'cutoutB1',
  B2: 'cutoutB2',
  B3: 'cutoutB3',
  B4: 'cutoutB3',
  C1: 'cutoutC1',
  C2: 'cutoutC2',
  C3: 'cutoutC3',
  C4: 'cutoutC3',
  D1: 'cutoutD1',
  D2: 'cutoutD2',
  D3: 'cutoutD3',
  D4: 'cutoutD3',
}

// mapping of Flex single slot cutouts to deck slots
export const FLEX_SINGLE_SLOT_BY_CUTOUT_ID: { [CutoutId: string]: string } = {
  cutoutA1: 'A1',
  cutoutA2: 'A2',
  cutoutA3: 'A3',
  cutoutB1: 'B1',
  cutoutB2: 'B2',
  cutoutB3: 'B3',
  cutoutC1: 'C1',
  cutoutC2: 'C2',
  cutoutC3: 'C3',
  cutoutD1: 'D1',
  cutoutD2: 'D2',
  cutoutD3: 'D3',
}

export const FAKE_FIXTURES_AND_AA: DeckDefinitionWithFakes = {
  locations: {
    addressableAreas: [
      {
        id: 'fakeA4',
        areaType: 'fakeStagingSlot',
        offsetFromCutoutFixture: [164.0, 0.0, 14.5],
        matingSurfaceUnitVector: [-1, 1, -1],
        boundingBox: {
          xDimension: 128.0,
          yDimension: 86.0,
          zDimension: 0,
        },
        displayName: 'Slot A4',
        compatibleModuleTypes: [],
      },
      {
        id: 'fakeB4',
        areaType: 'fakeStagingSlot',
        offsetFromCutoutFixture: [164.0, 0.0, 14.5],
        matingSurfaceUnitVector: [-1, 1, -1],
        boundingBox: {
          xDimension: 128.0,
          yDimension: 86.0,
          zDimension: 0,
        },
        displayName: 'Slot B4',
        compatibleModuleTypes: [],
      },
      {
        id: 'fakeC4',
        areaType: 'fakeStagingSlot',
        offsetFromCutoutFixture: [164.0, 0.0, 14.5],
        matingSurfaceUnitVector: [-1, 1, -1],
        boundingBox: {
          xDimension: 128.0,
          yDimension: 86.0,
          zDimension: 0,
        },
        displayName: 'Slot C4',
        compatibleModuleTypes: [],
      },
      {
        id: 'fakeD4',
        areaType: 'fakeStagingSlot',
        offsetFromCutoutFixture: [164.0, 0.0, 14.5],
        matingSurfaceUnitVector: [-1, 1, -1],
        boundingBox: {
          xDimension: 128.0,
          yDimension: 86.0,
          zDimension: 0,
        },
        displayName: 'Slot D4',
        compatibleModuleTypes: [],
      },
    ],
    cutouts: [
      {
        id: 'cutoutD1',
        position: [0.0, 0.0, 0.0],
        displayName: 'Cutout D1',
      },
      {
        id: 'cutoutD2',
        position: [164.0, 0.0, 0.0],
        displayName: 'Cutout D2',
      },
      {
        id: 'cutoutD3',
        position: [328.0, 0.0, 0.0],
        displayName: 'Cutout D3',
      },
      {
        id: 'cutoutC1',
        position: [0.0, 107, 0.0],
        displayName: 'Cutout C1',
      },
      {
        id: 'cutoutC2',
        position: [164.0, 107, 0.0],
        displayName: 'Cutout C2',
      },
      {
        id: 'cutoutC3',
        position: [328.0, 107, 0.0],
        displayName: 'Cutout C3',
      },
      {
        id: 'cutoutB1',
        position: [0.0, 214.0, 0.0],
        displayName: 'Cutout B1',
      },
      {
        id: 'cutoutB2',
        position: [164.0, 214.0, 0.0],
        displayName: 'Cutout B2',
      },
      {
        id: 'cutoutB3',
        position: [328.0, 214.0, 0.0],
        displayName: 'Cutout B3',
      },
      {
        id: 'cutoutA1',
        position: [0.0, 321.0, 0.0],
        displayName: 'Cutout A1',
      },
      {
        id: 'cutoutA2',
        position: [164.0, 321.0, 0.0],
        displayName: 'Cutout A2',
      },
      {
        id: 'cutoutA3',
        position: [328.0, 321.0, 0.0],
        displayName: 'Cutout A3',
      },
    ],
  },
  cutoutFixtures: [
    {
      id: 'fakeStagingAreaRightSlot',
      expectOpentronsModuleSerialNumber: false,
      mayMountTo: ['cutoutD3', 'cutoutC3', 'cutoutB3', 'cutoutA3'],
      displayName: 'Standard Slot Right',
      providesAddressableAreas: {
        cutoutD1: [],
        cutoutD2: [],
        cutoutD3: ['D3', 'fakeD4'],
        cutoutC1: [],
        cutoutC2: [],
        cutoutC3: ['C3', 'fakeC4'],
        cutoutB1: [],
        cutoutB2: [],
        cutoutB3: ['B3', 'fakeB4'],
        cutoutA1: [],
        cutoutA2: [],
        cutoutA3: ['A3', 'fakeA4'],
      },
      fixtureGroup: {},
      height: 0,
    },
    {
      id: 'fakeWasteChuteWithEmptySlot',
      expectOpentronsModuleSerialNumber: false,
      mayMountTo: ['cutoutD3'],
      displayName: 'Standard Slot Right',
      providesAddressableAreas: {
        cutoutD1: [],
        cutoutD2: [],
        cutoutD3: ['96ChannelWasteChute', 'fakeD4'],
        cutoutC1: [],
        cutoutC2: [],
        cutoutC3: [],
        cutoutB1: [],
        cutoutB2: [],
        cutoutB3: [],
        cutoutA1: [],
        cutoutA2: [],
        cutoutA3: [],
      },
      fixtureGroup: {},
      height: 0,
    },
    {
      id: 'fakeStagingSlotWithMagBlockV1',
      expectOpentronsModuleSerialNumber: false,
      mayMountTo: ['cutoutD3', 'cutoutC3', 'cutoutB3', 'cutoutA3'],
      displayName: 'Standard Slot Right',
      providesAddressableAreas: {
        cutoutD1: [],
        cutoutD2: [],
        cutoutD3: ['magneticBlockV1D3', 'fakeD4'],
        cutoutC1: [],
        cutoutC2: [],
        cutoutC3: ['magneticBlockV1C3', 'fakeC4'],
        cutoutB1: [],
        cutoutB2: [],
        cutoutB3: ['magneticBlockV1B3', 'fakeB4'],
        cutoutA1: [],
        cutoutA2: [],
        cutoutA3: ['magneticBlockV1A3', 'fakeA4'],
      },
      fixtureGroup: {},
      height: 0,
    },
  ],
}

// TODO(jh 01-15-25): Instead of typing slotId as `string`, type it as `AddressableAreaName`.
// returns the position associated with a slot id
export function getPositionFromSlotId(
  slotId: string,
  deckDef: DeckDefinition
): CoordinateTuple | null {
  const cutoutWithSlot =
    deckDef.robot.model === FLEX_ROBOT_TYPE
      ? FLEX_CUTOUT_BY_SLOT_ID[slotId]
      : OT2_CUTOUT_BY_SLOT_ID[slotId]

  const cutoutPosition =
    deckDef.locations.cutouts.find(cutout => cutout.id === cutoutWithSlot)
      ?.position ?? null

  // adjust for offset from cutout
  const offsetFromCutoutFixture = getAddressableAreaFromSlotId(slotId, deckDef)
    ?.offsetFromCutoutFixture ?? [0, 0, 0]

  const slotPosition: CoordinateTuple | null =
    cutoutPosition != null
      ? [
          cutoutPosition[0] + offsetFromCutoutFixture[0],
          cutoutPosition[1] + offsetFromCutoutFixture[1],
          cutoutPosition[2] + offsetFromCutoutFixture[2],
        ]
      : null

  return slotPosition
}

export function getAddressableAreaFromSlotId(
  slotId: string,
  deckDef: DeckDefinition
): AddressableArea | null {
  return (
    deckDef.locations.addressableAreas.find(
      addressableArea => addressableArea.id === slotId
    ) ?? null
  )
}

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
      return FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT
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
    const cutoutFixtureReplacment = replaceCutoutFixtureRemove(
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
  if (cutoutFixtureId === FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT) {
    return WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
  }
  if (cutoutFixtureId === FAKE_STAGING_SLOT_WITH_MAG_BLOCK) {
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

export const filterAAByAreaType = (
  cutoutFixtures: CutoutConfigMap[],
  deckDef: DeckDefinition,
  areaType: AreaTypeWithFakes
): CutoutConfigMap[] => {
  const deckDefWithFakeLocations = getDeckDefWithFakes(deckDef)
  return cutoutFixtures.filter(({ addressableAreaId }) => {
    return deckDefWithFakeLocations.locations.addressableAreas.find(
      aa => aa.id === addressableAreaId && aa.areaType === areaType
    )
  })
}

/**
 * Given a deck def add all fake cutout fixtures and fake AA
 * @param deckDefinition: deck def we wish to extend
 * @returns a new deck def with fake fixtures
 */
export const getDeckDefWithFakes = (
  deckDefinition: DeckDefinition
): DeckDefinitionWithFakes => {
  const locationsWithFakeAA = [
    ...deckDefinition.locations.addressableAreas,
    ...FAKE_FIXTURES_AND_AA.locations.addressableAreas,
  ]
  const fixturesWithFakes = [
    ...deckDefinition.cutoutFixtures,
    ...FAKE_FIXTURES_AND_AA.cutoutFixtures,
  ]
  return {
    ...deckDefinition,
    cutoutFixtures: fixturesWithFakes,
    locations: {
      ...deckDefinition.locations,
      addressableAreas: locationsWithFakeAA,
    },
  }
}

export const getAALocationForCutoutAndFixtureId = (
  addressableArea: AddressableAreaNamesWithFakes,
  deckDefinition: DeckDefinition
): CoordinateTuple => {
  const addressableAreaItem = getAAByAAId(addressableArea, deckDefinition)
  if (addressableAreaItem == null) {
    console.error(`Addressable area ${addressableArea} location was not found.`)
  }
  return addressableAreaItem?.offsetFromCutoutFixture ?? [0, 0, 0]
}

export const getAAByAAId = (
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDefinition: DeckDefinition
): AddressableAreaWithFakes => {
  const deckDefWithFakeLocations = getDeckDefWithFakes(deckDefinition)
  // there should be a match with addressableAreaId
  const aaItem = deckDefWithFakeLocations.locations.addressableAreas.find(
    (aaItem: AddressableAreaWithFakes) => aaItem.id === addressableAreaId
  ) as AddressableAreaWithFakes
  if (aaItem == null) {
    console.error(`Could not find AddressableArea for ${addressableAreaId}`)
  }
  return aaItem
}

export const getAAWithFakesFromCutoutFixtureId = (
  inputCutoutId: CutoutId,
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  deckDefinition: DeckDefinition
): AddressableAreaNamesWithFakes[] | null => {
  /**
   * Given a cutoutId and a cutoutFixtureId, returns a list of AA, null if there is none
   */
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

export function getCutoutFixtureIdsForModuleModel(
  moduleModel: ModuleModel
): CutoutFixtureId[] {
  const moduleFixtures = MODULE_FIXTURES_BY_MODEL[moduleModel]
  return moduleFixtures ?? []
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

export function getCutoutIdsFromModuleSlotName(
  slotName: string,
  moduleFixtures: CutoutFixture[], // cutout fixtures for a specific module model
  deckDef: DeckDefinition
): CutoutId[] {
  const fixtureIdByCutoutId = getFixtureIdByCutoutIdFromModuleSlotName(
    slotName,
    moduleFixtures,
    deckDef
  )
  return Object.keys(fixtureIdByCutoutId) as CutoutId[]
}

// provides an array of all addressable areas provided by a load module command
export function getAddressableAreaNamesFromLoadedModule(
  moduleModel: ModuleModel,
  slotName: ModuleLocation['slotName'],
  deckDef: DeckDefinition
): AddressableAreaName[] {
  const moduleFixtures = getCutoutFixturesForModuleModel(moduleModel, deckDef)
  const cutoutIds = getCutoutIdsFromModuleSlotName(
    slotName,
    moduleFixtures,
    deckDef
  )
  return moduleFixtures.reduce<AddressableAreaName[]>((acc, cutoutFixture) => {
    const providedAddressableAreas = cutoutIds.reduce<AddressableAreaName[]>(
      (innerAcc, cutoutId) => {
        const newAddressableAreas =
          cutoutFixture?.providesAddressableAreas[cutoutId] ?? []
        return [...innerAcc, ...newAddressableAreas]
      },
      []
    )
    return [...acc, ...providedAddressableAreas]
  }, [])
}

export const getModuleDisplayNameWithPort = (
  usbPortNumber: number | string
): string => {
  return `${getModuleDisplayName(
    FLEX_STACKER_MODULE_V1
  )} in USB-${usbPortNumber}`
}

export function getAAComboFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureIdsWithFakes | null,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  t: TFunction,
  usbPortNumber?: number | string
): string | null {
  const aaItem = getAAByAAId(addressableAreaId, deckDef)
  const translationFileName = 'deck_configuration'
  switch (cutoutFixtureId) {
    case FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE:
      if (aaItem.areaType === 'flexStacker') {
        return usbPortNumber != null
          ? t(`${translationFileName}:module_in_port`, {
              moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
              usbPortNumber,
            })
          : `${getModuleDisplayName(FLEX_STACKER_MODULE_V1)}`
      } else {
        return t(`${translationFileName}:waste_chute`)
      }
    case FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE:
      if (aaItem.areaType === 'flexStacker') {
        return usbPortNumber != null
          ? t(`${translationFileName}:module_in_port`, {
              moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
              usbPortNumber,
            })
          : `${getModuleDisplayName(FLEX_STACKER_MODULE_V1)}`
      } else {
        return t(`${translationFileName}:magnetic_block`)
      }
    case FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT:
      if (aaItem.areaType === 'wasteChute') {
        return t(`${translationFileName}:waste_chute`)
      }
      return null
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      if (aaItem.areaType === 'wasteChute') {
        return t(`${translationFileName}:waste_chute`)
      } else {
        return t(`${translationFileName}:staging_area_slot`)
      }
    default:
      return null
  }
}

// note: we've decided not to translate these strings
export function getFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureIdsWithFakes | null,
  usbPortNumber?: number | string
): string {
  switch (cutoutFixtureId) {
    case STAGING_AREA_RIGHT_SLOT_FIXTURE:
      return 'Staging area slot'
    case FAKE_STAGING_AREA_RIGHT_SLOT:
      return 'Fake Staging area slot'
    case TRASH_BIN_ADAPTER_FIXTURE:
      return 'Trash bin'
    case WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return 'Waste chute'
    case WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return 'Waste chute only with cover'
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return 'Waste chute with staging area slot'
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return 'Waste chute with staging area slot and cover'
    case HEATERSHAKER_MODULE_V1_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            HEATERSHAKER_MODULE_V1
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(HEATERSHAKER_MODULE_V1)
    case TEMPERATURE_MODULE_V2_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            TEMPERATURE_MODULE_V2
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(TEMPERATURE_MODULE_V2)
    case MAGNETIC_BLOCK_V1_FIXTURE:
    case FAKE_STAGING_SLOT_WITH_MAG_BLOCK:
      return `${getModuleDisplayName(MAGNETIC_BLOCK_V1)}`
    case STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE:
      return `${getModuleDisplayName(MAGNETIC_BLOCK_V1)} with staging area slot`
    case THERMOCYCLER_V2_REAR_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            THERMOCYCLER_MODULE_V2
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(THERMOCYCLER_MODULE_V2)
    case THERMOCYCLER_V2_FRONT_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            THERMOCYCLER_MODULE_V2
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(THERMOCYCLER_MODULE_V2)
    case ABSORBANCE_READER_V1_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            ABSORBANCE_READER_V1
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(ABSORBANCE_READER_V1)
    case FLEX_STACKER_V1_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            FLEX_STACKER_MODULE_V1
          )} in USB-${usbPortNumber}`
        : getModuleDisplayName(FLEX_STACKER_MODULE_V1)
    case FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            FLEX_STACKER_MODULE_V1
          )} in USB-${usbPortNumber} and waste chute with cover`
        : `${getModuleDisplayName(
            FLEX_STACKER_MODULE_V1
          )} and waste chute with cover`
    case FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            FLEX_STACKER_MODULE_V1
          )} in USB-${usbPortNumber} and waste chute`
        : `${getModuleDisplayName(FLEX_STACKER_MODULE_V1)} and waste chute`
    case FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE:
      return usbPortNumber != null
        ? `${getModuleDisplayName(
            FLEX_STACKER_MODULE_V1
          )} in USB-${usbPortNumber} and magnetic block`
        : `${getModuleDisplayName(FLEX_STACKER_MODULE_V1)} and magnetic block`
    case SINGLE_CENTER_SLOT_FIXTURE:
      return 'Center slot'
    case SINGLE_RIGHT_SLOT_FIXTURE:
      return 'Right slot'
    case SINGLE_LEFT_SLOT_FIXTURE:
      return 'Left slot'
    default:
      console.error('was not able to find display name for: ', cutoutFixtureId)
      return 'Slot'
  }
}

export const STANDARD_OT2_SLOTS: AddressableAreaName[] = [
  ADDRESSABLE_AREA_1,
  ADDRESSABLE_AREA_2,
  ADDRESSABLE_AREA_3,
  ADDRESSABLE_AREA_4,
  ADDRESSABLE_AREA_5,
  ADDRESSABLE_AREA_6,
  ADDRESSABLE_AREA_7,
  ADDRESSABLE_AREA_8,
  ADDRESSABLE_AREA_9,
  ADDRESSABLE_AREA_10,
  ADDRESSABLE_AREA_11,
]

export const STANDARD_FLEX_SLOTS: AddressableAreaName[] = [
  A1_ADDRESSABLE_AREA,
  A2_ADDRESSABLE_AREA,
  A3_ADDRESSABLE_AREA,
  B1_ADDRESSABLE_AREA,
  B2_ADDRESSABLE_AREA,
  B3_ADDRESSABLE_AREA,
  C1_ADDRESSABLE_AREA,
  C2_ADDRESSABLE_AREA,
  C3_ADDRESSABLE_AREA,
  D1_ADDRESSABLE_AREA,
  D2_ADDRESSABLE_AREA,
  D3_ADDRESSABLE_AREA,
]

export type VISUAL_SLOTS =
  | 'VSA1'
  | 'VSB1'
  | 'VSC1'
  | 'VSD1'
  | 'VSA2'
  | 'VSB2'
  | 'VSC2'
  | 'VSD2'
  | 'VSA3'
  | 'VSB3'
  | 'VSC3'
  | 'VSD3'
  | 'VSA4'
  | 'VSB4'
  | 'VSC4'
  | 'VSD4'

export const VS_TO_AA: Record<VISUAL_SLOTS, AddressableAreaNamesWithFakes[]> = {
  VSA1: [
    'A1',
    'magneticBlockV1A1',
    'temperatureModuleV2A1',
    'heaterShakerV1A1',
    'movableTrashA1',
  ],
  VSB1: [
    'B1',
    'magneticBlockV1B1',
    'temperatureModuleV2B1',
    'heaterShakerV1B1',
    'movableTrashB1',
  ],
  VSC1: [
    'C1',
    'magneticBlockV1C1',
    'temperatureModuleV2C1',
    'heaterShakerV1C1',
    'movableTrashC1',
  ],
  VSD1: [
    'D1',
    'magneticBlockV1D1',
    'temperatureModuleV2D1',
    'heaterShakerV1D1',
    'movableTrashD1',
  ],
  VSA2: ['A2', 'magneticBlockV1A2'],
  VSB2: ['B2', 'magneticBlockV1B2'],
  VSC2: ['C2', 'magneticBlockV1C2'],
  VSD2: ['D2', 'magneticBlockV1D2'],
  VSA3: [
    'A3',
    'magneticBlockV1A3',
    'temperatureModuleV2A3',
    'heaterShakerV1A3',
    'movableTrashA3',
  ],
  VSB3: [
    'B3',
    'magneticBlockV1B3',
    'temperatureModuleV2B3',
    'heaterShakerV1B3',
    'movableTrashB3',
  ],
  VSC3: [
    'C3',
    'magneticBlockV1C3',
    'temperatureModuleV2C3',
    'heaterShakerV1C3',
    'movableTrashC3',
  ],
  VSD3: [
    'D3',
    'magneticBlockV1D3',
    'temperatureModuleV2D3',
    'heaterShakerV1D3',
    'movableTrashD3',
    '96ChannelWasteChute',
    '1ChannelWasteChute',
    '8ChannelWasteChute',
    'gripperWasteChute',
  ],
  VSA4: ['fakeA4', 'A4', 'flexStackerModuleV1A4'],
  VSB4: ['fakeB4', 'B4', 'flexStackerModuleV1B4'],
  VSC4: ['fakeC4', 'C4', 'flexStackerModuleV1C4'],
  VSD4: ['fakeD4', 'D4', 'flexStackerModuleV1D4'],
}

export const getVisualSlotIdFromAAId = (
  aaId: AddressableAreaNamesWithFakes
): string => {
  const vsId = Object.entries(VS_TO_AA).find(([key, value]) =>
    value.includes(aaId)
  )?.[0]
  return vsId as string // should always find a match
}

export const getAAWithFakesFromVSId = (
  vsId: string
): AddressableAreaNamesWithFakes | null => {
  switch (vsId) {
    case 'VSA1':
      return 'A1'
    case 'VSB1':
      return 'B1'
    case 'VSC1':
      return 'C1'
    case 'VSD1':
      return 'D1'
    case 'VSA2':
      return 'A2'
    case 'VSB2':
      return 'B2'
    case 'VSC2':
      return 'C2'
    case 'VSD2':
      return 'D2'
    case 'VSA3':
      return 'A3'
    case 'VSB3':
      return 'B3'
    case 'VSC3':
      return 'C3'
    case 'VSD3':
      return 'D3'
    case 'VSA4':
      return 'fakeA4'
    case 'VSB4':
      return 'fakeB4'
    case 'VSC4':
      return 'fakeC4'
    case 'VSD4':
      return 'fakeD4'
    default:
      console.error(`could not find a match for VS:${vsId}`)
      return null
  }
}

export const isAddressableAreaStandardSlot = (
  addressableAreaName: AddressableAreaName,
  deckDef: DeckDefinition
): boolean =>
  (deckDef.robot.model === FLEX_ROBOT_TYPE
    ? STANDARD_FLEX_SLOTS
    : STANDARD_OT2_SLOTS
  ).includes(addressableAreaName)

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
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const aaList = getAAWithFakesFromCutoutFixtureId(cutoutId, fixtureId, deckDef)
  return aaList?.find(
    aa =>
      getAAByAAId(aa, deckDef).areaType === MODULE_AA_TYPE_BY_MODEL[moduleModel]
  ) as AddressableAreaNamesWithFakes
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
  addressableAreaId: AddressableAreaNamesWithFakes
): AddressableAreaNamesWithFakes | null => {
  const addressableAreasByFIxtureId = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    getDeckDefFromRobotType('OT-3 Standard')
  )
  const aaListForFixtureId = addressableAreasByFIxtureId[fixtureId] ?? []
  if (LEFT_AND_CENTER_CUTOUTS.includes(cutoutId)) {
    return aaListForFixtureId[0]
  } else if (WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE === fixtureId) {
    return DEFAULT_AA_FOR_WASTE_CHUTE
  } else {
    const aa = aaListForFixtureId.find((aa: AddressableAreaNamesWithFakes) => {
      const vsId = getVisualSlotIdFromAAId(aa)
      const singleSlotId = getAAWithFakesFromVSId(vsId)
      console.log('aa: ', aa)
      console.log('vsId: ', vsId)
      console.log('addressableAreaId; ', addressableAreaId)
      return singleSlotId === addressableAreaId
    })
    return aa as AddressableAreaNamesWithFakes // we can cast this bc there should me a match for every fixtureId
  }
}

export const isModuleAllowedOnAA = (
  cutoutId: CutoutId,
  aa: AddressableAreaNamesWithFakes,
  moduleModel?: ModuleModel
): boolean => {
  if (moduleModel) {
    const fixtureId = getCutoutFixtureIdsForModuleModel(moduleModel)
    const aaForFixture = getAAWithFakesFromCutoutFixtureId(
      cutoutId,
      fixtureId[0],
      getDeckDefFromRobotType('OT-3 Standard')
    )
    console.log('aa: ', aa)
    const aaWithSlotLikeId = aaForFixture?.map(item => {
      return {
        aa: item,
        slotLikeId: getAAWithFakesFromVSId(
          getVisualSlotIdForAA(cutoutId, fixtureId[0], item)
        ),
      }
    })
    if (
      SINGLE_RIGHT_CUTOUTS.includes(cutoutId) &&
      moduleModel === FLEX_STACKER_MODULE_V1
    ) {
      const item = aaWithSlotLikeId?.find(
        aaItem =>
          FLEX_STAGING_ADDRESSABLE_AREAS_WITH_FAKES.includes(aaItem.aa) &&
          aa === aaItem.slotLikeId
      )
      return item === undefined ? false : true
    }
    return aaWithSlotLikeId?.some(item => item.slotLikeId === aa) ?? false
  } else {
    return true
  }
}

export const getVisualSlotIdForAA = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureIdsWithFakes,
  addressableAreaId: AddressableAreaNamesWithFakes
): string => {
  const addressableAreasByFIxtureId = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    getDeckDefFromRobotType('OT-3 Standard')
  )
  const aaListForFixtureId = addressableAreasByFIxtureId[fixtureId] ?? []
  const aaMatchInDef = aaListForFixtureId.find(aa => aa === addressableAreaId)
  return aaMatchInDef
    ? getVisualSlotIdFromAAId(aaMatchInDef)
    : (addressableAreaId as AddressableAreaNamesWithFakes)
}

export const getAASlotDisplayName = (
  addressableAreaId: AddressableAreaNamesWithFakes
): string => {
  return addressableAreaId.replace('fake', '')
}

/**
 * Given a cutout fixture find if should be changed to a combo fixture
 * @param addedCutoutConfigs: fixtures list selected to add to deck
 * @param deckConfigWithAA: current deck state
 * @param cutoutId:
 * @returns update list of the current deck with the combo fixtures replacements
 */
export const replaceCutoutFixtureWithComboFixture = (
  addedCutoutConfigs: CutoutConfigMap[],
  deckConfigWithAA: CutoutConfigMap[],
  cutoutId: CutoutId
): CutoutConfigMap[] => {
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    getDeckDefFromRobotType('OT-3 Standard')
  )

  return addedCutoutConfigs.map(aaCutoutItem => {
    console.log('Processing cutout item:', aaCutoutItem)

    // Filter potential combo fixture options
    const comboFixturesOptions = Object.entries(
      addressableAreasById
    ).filter(([_, areaIds]) => areaIds.includes(aaCutoutItem.addressableAreaId))

    // Try to match with deck config
    for (const dc of deckConfigWithAA) {
      const match = comboFixturesOptions.find(([, areaIds]) =>
        areaIds.includes(dc.addressableAreaId)
      )

      if (match) {
        if (match[0] === aaCutoutItem.cutoutFixtureId) {
          return { ...aaCutoutItem }
        } else {
          const [fixtureId, areaList] = match
          const otherModules = areaList.filter(
            id => id !== aaCutoutItem.addressableAreaId
          )
          const matchedModule = deckConfigWithAA.find(dc =>
            otherModules.includes(dc.addressableAreaId)
          )
          const sn = matchedModule?.opentronsModuleSerialNumber
          return {
            ...aaCutoutItem,
            cutoutFixtureId: getReplacementFixtureForFakeFixture(
              fixtureId as CutoutFixtureIdsWithFakes
            ) as CutoutFixtureId,
            opentronsModuleSerialNumber:
              sn ?? aaCutoutItem.opentronsModuleSerialNumber,
          }
        }
      } else {
        console.warn('Invalid match for:', aaCutoutItem.cutoutFixtureId)
        continue
      }
    }
    // Fallback if no match found
    return { ...aaCutoutItem }
  })
}

/**
 * Given a cutout fixture to remove find what fixture to use instead
 * @param cutoutFixtureRemoved: fixtures to remove
 * @param cutoutId
 * @param addressableAreaId to remove from fixture
 * @returns fixture to replace with
 */
export const replaceCutoutFixtureRemove = (
  cutoutFixtureRemoved: CutoutFixtureIdsWithFakes,
  cutoutId: CutoutId,
  addressableAreaId: AddressableAreaNamesWithFakes
): CutoutFixtureIdsWithFakes => {
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    deckDef
  )
  const aaForCutoutAndFixture = getAAWithFakesFromCutoutFixtureId(
    cutoutId,
    cutoutFixtureRemoved,
    deckDef
  )
  if (WASTE_CHUTE_WITH_FAKE_FIXTURES.includes(cutoutFixtureRemoved)) {
    if (addressableAreaId === DEFAULT_AA_FOR_WASTE_CHUTE) {
      return cutoutFixtureRemoved ===
        FLEX_STACKER_WTIH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
        ? FLEX_STACKER_V1_FIXTURE
        : SINGLE_RIGHT_SLOT_FIXTURE
    } else {
      return WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
    }
  } else {
    const updated = aaForCutoutAndFixture?.map(aa => {
      const vsId = getVisualSlotIdForAA(cutoutId, cutoutFixtureRemoved, aa)
      return aa === addressableAreaId ? getAAWithFakesFromVSId(vsId) : aa
    })
    const match = Object.entries(addressableAreasById).find(([, value]) =>
      isEqual(
        value.sort(),
        WASTE_CHUTE_WITH_FAKE_FIXTURES.includes(cutoutFixtureRemoved)
          ? aaForCutoutAndFixture?.sort()
          : updated?.sort()
      )
    )
    if (match) {
      return match[0] as CutoutFixtureIdsWithFakes
    }
    // Fallback if no match found
    return cutoutFixtureRemoved
  }
}

export const isFixtureInUsbModules = (fixtureId: CutoutFixtureId): boolean => {
  const moduleFixturesWithoutMagBlock = Object.entries(
    MODULE_FIXTURES_BY_MODEL
  ).filter(([key, value]) => key !== MAGNETIC_BLOCK_V1)
  return (
    FLEX_STACKER_FIXTURES.includes(fixtureId) ||
    Object.values(moduleFixturesWithoutMagBlock).some(fixtures =>
      fixtures?.includes(fixtureId)
    )
  )
}
