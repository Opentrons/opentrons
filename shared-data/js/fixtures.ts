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
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from './constants'
import { getCutoutIdForSlotName, getDeckDefFromRobotType } from './helpers'
import { getModuleDisplayName } from './modules'

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
        displayName: 'Slot A4',
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
        displayName: 'Slot A4',
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
        displayName: 'Slot A4',
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
  deckDefinition: DeckDefinition
): CutoutFixtureIdsWithFakes => {
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
  }
  return cutoutFixtureId
}

export const getReplacementFixtureForFixtureRemoval = (
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  cutoutId: CutoutId
): CutoutFixtureId => {
  if (cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
    return SINGLE_RIGHT_SLOT_FIXTURE
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
      deckDef
    )

    const aaPerCutoutFixture = getAAFromCutoutFixtureId(
      obj.cutoutId,
      cutoutFixtureReplacment,
      deckDef
    )
    aaPerCutoutFixture?.forEach(item => {
      acc.push({
        ...obj,
        addressableAreaId: item,
        cutoutFixtureId: cutoutFixtureReplacment,
      })
    })
    return acc
  }, [])
}

export const filterAAByAreaType = (
  cutoutFixtures: CutoutConfigMap[],
  deckDef: DeckDefinition,
  areaType: AreaTypeWithFakes
): CutoutConfigMap[] => {
  const deckDefWithFakeLocations = getDeckDefAAWithFakeAA(deckDef)
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
export const getDeckDefAAWithFakeAA = (
  deckDefinition: DeckDefinition
): DeckDefinitionWithFakes => {
  const locationsWithFakeAA = [
    ...deckDefinition.locations.addressableAreas,
    ...FAKE_FIXTURES_AND_AA.locations.addressableAreas,
  ]
  return {
    ...deckDefinition,
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
  const deckDefWithFakeLocations = getDeckDefAAWithFakeAA(deckDefinition)
  // there should be a match with addressableAreaId
  const aaItem = deckDefWithFakeLocations.locations.addressableAreas.find(
    (aaItem: AddressableAreaWithFakes) => aaItem.id === addressableAreaId
  ) as AddressableAreaWithFakes
  if (aaItem == null) {
    console.error(`Could not find AddressableArea for ${addressableAreaId}`)
  }
  return aaItem
}

export const getAAFromCutoutFixtureId = (
  inputCutoutId: CutoutId,
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  deckDefinition: DeckDefinition
): AddressableAreaNamesWithFakes[] | null => {
  /**
   * Given a cutoutId and a cutoutFixtureId, returns a list of AA, or null if there is none
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
// note: we've decided not to translate these strings
export function getFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureIdsWithFakes | null,
  usbPortNumber?: number | string
): string {
  switch (cutoutFixtureId) {
    case STAGING_AREA_RIGHT_SLOT_FIXTURE:
      return 'Staging area slot'
    case FAKE_STAGING_AREA_RIGHT_SLOT:
      // for debugging perpuses change to display name
      return 'Fake Staging area slot'
    case TRASH_BIN_ADAPTER_FIXTURE:
      return 'Trash bin'
    case WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return 'Waste chute'
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
    default:
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

export const AA_TO_AA_SLOT: Record<string, AddressableAreaNamesWithFakes> = {
  D4: 'fakeD4',
  C4: 'fakeC4',
  B4: 'fakeB4',
  A4: 'fakeA4',
  flexStackerModuleV1D4: 'fakeD4',
  flexStackerModuleV1C4: 'fakeC4',
  flexStackerModuleV1B4: 'fakeB4',
  flexStackerModuleV1A4: 'fakeA4',
  magneticBlockV1A3: 'A3',
  magneticBlockV1B3: 'B3',
  magneticBlockV1C3: 'C3',
  magneticBlockV1D3: 'D3',
  '1ChannelWasteChute': 'D3',
  '8ChannelWasteChute': 'D3',
  '96ChannelWasteChute': 'D3',
  gripperWasteChute: 'D3',
  temperatureModuleV2D3: 'D3',
  temperatureModuleV2C3: 'C3',
  temperatureModuleV2B3: 'B3',
  temperatureModuleV2A3: 'A3',
  heaterShakerV1D3: 'D3',
  heaterShakerV1C3: 'C3',
  heaterShakerV1B3: 'B3',
  heaterShakerV1A3: 'A3',
  movableTrashD3: 'D3',
  movableTrashC3: 'C3',
  movableTrashB3: 'B3',
  movableTrashA3: 'A3',
}

export const MODULE_CUTOUT_FIXTURE_ID = [
  'heaterShakerModuleV1',
  'temperatureModuleV2',
  'magneticBlockV1',
  'stagingAreaSlotWithMagneticBlockV1',
  'thermocyclerModuleV2Rear',
  'thermocyclerModuleV2Front',
  'absorbanceReaderV1',
  'flexStackerModuleV1',
  'flexStackerModuleV1WithMagneticBlockV1',
]

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
export const getFlexDeckDefAAByFixtureIdForCutoutId = (
  cutoutId: CutoutId
): Record<CutoutFixtureIdsWithFakes, AddressableAreaNamesWithFakes[]> => {
  const deckDef = getDeckDefFromRobotType('OT-3 Standard')
  const deckDefWithFakes = getDeckDefAAWithFakeAA(deckDef)
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

/**
 * get relevent aa name that match with cutoutId and fixtureId.
 *
 * @param cutoutId - The cutoutId we are looking for.
 * @param fixtureId - The fixtureId we are looking for.
 * @returns The aa name or null if not match found.
 */
export const getAddressableAreaMatchForAreaId = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureId,
  addressableAreaId: AddressableAreaNamesWithFakes
): AddressableAreaNamesWithFakes | null => {
  const addressableAreasByFIxtureId = getFlexDeckDefAAByFixtureIdForCutoutId(
    cutoutId
  )
  const aaListForFixtureId = addressableAreasByFIxtureId[fixtureId] ?? []
  if (LEFT_AND_CENTER_CUTOUTS.includes(cutoutId)) {
    return aaListForFixtureId[0]
  } else if (WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE === fixtureId) {
    return DEFAULT_AA_FOR_WASTE_CHUTE
  } else {
    const aa = aaListForFixtureId.find(
      (aa: AddressableAreaNamesWithFakes) =>
        aa in AA_TO_AA_SLOT && AA_TO_AA_SLOT[aa] === addressableAreaId
    )
    return aa as AddressableAreaNamesWithFakes // we can cast this bc there should me a match for every fixtureId
  }
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
  const addressableAreasById = getFlexDeckDefAAByFixtureIdForCutoutId(cutoutId)

  return addedCutoutConfigs.map(aaCutoutItem => {
    console.log('Processing cutout item:', aaCutoutItem)

    // Only handle SINGLE_RIGHT_CUTOUTS
    if (!SINGLE_RIGHT_CUTOUTS.includes(aaCutoutItem.cutoutId)) {
      return { ...aaCutoutItem }
    }

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
            cutoutFixtureId: fixtureId as CutoutFixtureId,
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
