/**
 * Code to deal with fixtures in the sense of deck configuration.
 * Not to be confused with fixtures in the sense of dummy test data.
 */
import {
  FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_FIXTURES,
  FLEX_STAGING_ADDRESSABLE_AREAS_WITH_FAKES,
  THERMOCYCLER_MODULE_CUTOUTS,
  VACUUM_MODULE_CUTOUT,
  VACUUM_MODULE_V1,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
  WASTE_CHUTE_ONLY_FIXTURES_WITH_FAKES,
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
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  HEATERSHAKER_MODULE_V1,
  HEATERSHAKER_MODULE_V1_FIXTURE,
  MAGNETIC_BLOCK_V1,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MODULE_FIXTURES_BY_MODEL,
  SINGLE_CENTER_SLOT_FIXTURE,
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
import { getDeckDefFromRobotType } from './helpers'
import {
  getAAForModuleFixture,
  getAAsToFixtureIdFromDeckDefWithFakes,
  getAAWithFakesFromCutoutFixtureId,
} from './helpers/deckConfiguration/getAddressableAreaFrom'
import {
  getCutoutFixtureIdsForModuleModel,
  getCutoutFixturesForModuleModel,
  getFixtureIdByCutoutIdFromModuleSlotName,
  getMainFixtureIdForAA,
  getReplacementFixtureForFakeFixture,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
} from './helpers/deckConfiguration/getFixtureFrom'
import {
  getAAWithFakesFromVSId,
  getVisualSlotIdFromAAId,
} from './helpers/deckConfiguration/getVisualSlotFrom'
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
import type { CutoutConfigAndCompatibility, VISUAL_SLOTS } from './helpers'
import type {
  AddressableArea,
  CoordinateTuple,
  CutoutConfig,
  CutoutConfigMap,
  CutoutFixture,
  DeckConfiguration,
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

// TODO(tz, 12-22-25): Remove this and use deckDefinition instead https://opentrons.atlassian.net/browse/AUTH-2736
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

// TODO(tz, 12-22-25): Remove this and use deckDefinition instead https://opentrons.atlassian.net/browse/AUTH-2736
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
        cutoutD3: ['1ChannelWasteChute', 'fakeD4'],
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
  deckDef: DeckDefinition,
  //  PD needs this in order to position zooming into the slot
  //  the hopper doesn't have its own AddressableAreaName
  hopperAdjustedOffset?: number
): CoordinateTuple | null {
  const cutoutWithSlot = getCutoutIdForSlotOrAddressableArea(slotId, deckDef)

  const cutoutPosition =
    cutoutWithSlot != null
      ? (deckDef.locations.cutouts.find(cutout => cutout.id === cutoutWithSlot)
          ?.position ?? null)
      : null

  // adjust for offset from cutout
  const offsetFromCutoutFixture = getAddressableAreaFromSlotId(slotId, deckDef)
    ?.offsetFromCutoutFixture ?? [0, 0, 0]

  const slotPosition: CoordinateTuple | null =
    cutoutPosition != null
      ? [
          cutoutPosition[0] +
            offsetFromCutoutFixture[0] +
            (hopperAdjustedOffset != null ? hopperAdjustedOffset : 0),
          cutoutPosition[1] + offsetFromCutoutFixture[1],
          cutoutPosition[2] + offsetFromCutoutFixture[2],
        ]
      : null

  return slotPosition
}

/**
 * Resolve the cutout that hosts a slot or addressable area.
 *
 * Standard single/staging slots are looked up via the hard-coded maps.
 * Module-specific addressable areas (e.g. vacuumModuleV1DockA4) are not in those
 * maps, so fall back to finding which cutout fixture provides the AA in the deck def.
 * Without this, labware on the vacuum module dock resolves to null coordinates and
 * MoveLabwareOnDeck animates it from off-deck.
 */
function getCutoutIdForSlotOrAddressableArea(
  slotId: string,
  deckDef: DeckDefinition
): CutoutId | OT2CutoutId | null {
  const fromSlotMap: CutoutId | OT2CutoutId | undefined =
    deckDef.robot.model === FLEX_ROBOT_TYPE
      ? FLEX_CUTOUT_BY_SLOT_ID[slotId]
      : OT2_CUTOUT_BY_SLOT_ID[slotId]

  if (fromSlotMap != null) {
    return fromSlotMap
  }

  // Module addressable areas (vacuum dock, stacker shuttle, etc.)
  for (const cutoutFixture of deckDef.cutoutFixtures) {
    const match = Object.entries(cutoutFixture.providesAddressableAreas).find(
      ([_, providedAAs]) => (providedAAs as string[]).includes(slotId)
    )
    if (match != null) {
      return match[0] as CutoutId
    }
  }

  return null
}

export function getPositionFromAddressableAreaId(args: {
  addressableAreaId: AddressableAreaName
  deckDef: DeckDefinition
  deckConfiguration: DeckConfiguration
}): CoordinateTuple | null {
  const { addressableAreaId, deckDef, deckConfiguration } = args

  for (const cutoutFixture of deckDef.cutoutFixtures) {
    const match = Object.entries(cutoutFixture.providesAddressableAreas).find(
      ([_, providedAA]) => providedAA.includes(addressableAreaId)
    )
    const isInDeckConfig = deckConfiguration.some(
      config => config.cutoutFixtureId === cutoutFixture.id
    )
    if (match == null) {
      continue
    }
    const [cutoutMatch] = match
    if (isInDeckConfig) {
      const addressableAreaOffset = getAAByAAId(
        addressableAreaId,
        deckDef
      ).offsetFromCutoutFixture
      const cutoutPosition =
        deckDef.locations.cutouts.find(cutout => cutout.id === cutoutMatch)
          ?.position ?? null
      if (cutoutPosition == null) {
        continue
      }
      return [
        cutoutPosition[0] + addressableAreaOffset[0],
        cutoutPosition[1] + addressableAreaOffset[1],
        cutoutPosition[2] + addressableAreaOffset[2],
      ]
    }
  }
  console.warn('no match found', {
    addressableAreaId,
    deckDef,
    deckConfiguration,
  })
  return [0, 0, 0]
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
  )!
  if (aaItem == null) {
    console.error(`Could not find AddressableArea for ${addressableAreaId}`)
  }
  return aaItem
}

// #region: get fixture id by cutout id from module anchor cutout id

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
  return `${getModuleDisplayName(FLEX_STACKER_MODULE_V1)} in ${usbPortNumber}`
}

export function getAAComboFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureIdsWithFakes | null,
  addressableAreaId: AddressableAreaNamesWithFakes,
  deckDef: DeckDefinition,
  t: TFunction,
  usbPortNumber?: string | null
): string | null {
  const aaItem = getAAByAAId(addressableAreaId, deckDef)
  const translationFileName = 'deck_configuration'
  switch (cutoutFixtureId) {
    case FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE:
    case FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE:
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
    case FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE:
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
  t: TFunction,
  cutoutFixtureId: CutoutFixtureIdsWithFakes | null,
  usbPortNumber?: string | null
): string {
  const translationFileName = 'deck_configuration'

  switch (cutoutFixtureId) {
    case STAGING_AREA_RIGHT_SLOT_FIXTURE:
      return t(`${translationFileName}:staging_area_slot_title`)
    case FAKE_STAGING_AREA_RIGHT_SLOT:
      return 'Fake Staging Area Slot'
    case TRASH_BIN_ADAPTER_FIXTURE:
      return t(`${translationFileName}:trash_bin`)
    case WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return t(`${translationFileName}:waste_chute`)
    case WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return t(`${translationFileName}:waste_chute_with_cover`)
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return t(`${translationFileName}:waste_chute_with_staging_area_slot`)
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return t(
        `${translationFileName}:waste_chute_with_staging_area_slot_and_cover`
      )
    case HEATERSHAKER_MODULE_V1_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(HEATERSHAKER_MODULE_V1),
            usbPortNumber,
          })
        : getModuleDisplayName(HEATERSHAKER_MODULE_V1)
    case TEMPERATURE_MODULE_V2_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(TEMPERATURE_MODULE_V2),
            usbPortNumber,
          })
        : getModuleDisplayName(TEMPERATURE_MODULE_V2)
    case MAGNETIC_BLOCK_V1_FIXTURE:
    case FAKE_STAGING_SLOT_WITH_MAG_BLOCK_FIXTURE:
      return `${getModuleDisplayName(MAGNETIC_BLOCK_V1)}`
    case STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE:
      return t(`${translationFileName}:module_with_staging_area`, {
        moduleName: getModuleDisplayName(MAGNETIC_BLOCK_V1),
      })
    case THERMOCYCLER_V2_FRONT_FIXTURE:
    case THERMOCYCLER_V2_REAR_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(THERMOCYCLER_MODULE_V2),
            usbPortNumber,
          })
        : getModuleDisplayName(THERMOCYCLER_MODULE_V2)
    case ABSORBANCE_READER_V1_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(ABSORBANCE_READER_V1),
            usbPortNumber,
          })
        : getModuleDisplayName(ABSORBANCE_READER_V1)
    case FLEX_STACKER_V1_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
            usbPortNumber,
          })
        : getModuleDisplayName(FLEX_STACKER_MODULE_V1)
    case FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE:
      return usbPortNumber != null
        ? t(
            `${translationFileName}:module_in_port_and_waste_chute_with_cover`,
            {
              moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
              usbPortNumber,
            }
          )
        : t(`${translationFileName}:module_with_waste_chute_and_cover`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
          })
    case FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port_and_waste_chute`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
            usbPortNumber,
          })
        : t(`${translationFileName}:module_with_waste_chute`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
          })
    case FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port_and_magnetic_block`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
            usbPortNumber,
          })
        : t(`${translationFileName}:module_with_mag_block`, {
            moduleName: getModuleDisplayName(FLEX_STACKER_MODULE_V1),
          })
    case VACUUM_MODULE_V1:
      return usbPortNumber != null
        ? t(`${translationFileName}:module_in_port`, {
            moduleName: getModuleDisplayName(VACUUM_MODULE_V1),
            usbPortNumber,
          })
        : getModuleDisplayName(VACUUM_MODULE_V1)
    case SINGLE_CENTER_SLOT_FIXTURE:
      return t(`${translationFileName}:center_slot`)
    case SINGLE_RIGHT_SLOT_FIXTURE:
      return t(`${translationFileName}:right_slot`)
    case SINGLE_LEFT_SLOT_FIXTURE:
      return t(`${translationFileName}:left_slot`)
    default:
      console.error('was not able to find display name for: ', cutoutFixtureId)
      return t(`${translationFileName}:slot`)
  }
}

// TODO(tz, 12-22-25): Remove this and use deckDefinition instead https://opentrons.atlassian.net/browse/AUTH-2736
// TODO: Move to helpers/deckDeclarationHelpers.ts
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

// TODO(tz, 12-22-25): Remove this and use deckDefinition instead https://opentrons.atlassian.net/browse/AUTH-2736
// TODO: Move to helpers
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

export const isAddressableAreaStandardSlot = (
  addressableAreaName: AddressableAreaName,
  deckDef: DeckDefinition
): boolean =>
  (deckDef.robot.model === FLEX_ROBOT_TYPE
    ? STANDARD_FLEX_SLOTS
    : STANDARD_OT2_SLOTS
  ).includes(addressableAreaName)

export const isModuleAllowedOnAA = (
  cutoutId: CutoutId,
  aa: AddressableAreaNamesWithFakes,
  moduleModel: ModuleModel
): boolean => {
  if (moduleModel === THERMOCYCLER_MODULE_V2) {
    return THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId)
  }
  const fixtureId = getCutoutFixtureIdsForModuleModel(moduleModel)
  const aaForFixture = getAAWithFakesFromCutoutFixtureId(
    cutoutId,
    fixtureId[0],
    getDeckDefFromRobotType('OT-3 Standard')
  )
  const aaWithSlotLikeId = aaForFixture?.map(item => {
    return {
      aa: item,
      slotLikeId: getAAWithFakesFromVSId(
        getVisualSlotIdFromAAId(item) as VISUAL_SLOTS
      ),
    }
  })
  if (
    SINGLE_RIGHT_CUTOUTS.includes(cutoutId) &&
    moduleModel === FLEX_STACKER_MODULE_V1
  ) {
    return (
      aaWithSlotLikeId?.some(
        aaItem =>
          FLEX_STAGING_ADDRESSABLE_AREAS_WITH_FAKES.includes(aaItem.aa) &&
          aa === aaItem.slotLikeId
      ) ?? false
    )
  }
  return aaWithSlotLikeId?.some(item => item.slotLikeId === aa) ?? false
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
 * Get what fixture waste chute is in the deck config
 */
const getWasteChuteFixtureType = (
  deckConfig: CutoutConfigMap[],
  cutoutId: CutoutId
): CutoutFixtureIdsWithFakes | null => {
  return (
    deckConfig.find(
      fixture =>
        WASTE_CHUTE_ONLY_FIXTURES_WITH_FAKES.includes(
          fixture.cutoutFixtureId
        ) && fixture.cutoutId === cutoutId
    )?.cutoutFixtureId ?? null
  )
}

/**
 * Check if a fixture has flex stacker capabilities
 */
const hasFlexStackerFixture = (
  deckConfig: CutoutConfigMap[],
  cutoutId: CutoutId
): boolean => {
  return deckConfig.some(
    fixture =>
      FLEX_STACKER_FIXTURES.includes(
        fixture.cutoutFixtureId as CutoutFixtureId
      ) && fixture.cutoutId === cutoutId
  )
}

/**
 * Get the replacement fixture for a given fixture ID in waste chute cutout
 * @param cutoutFixtureId: the current fixture ID
 * @param wasteChuteFixture: the waste chute fixture type in the cutout
 * @param hasFlexStacker: whether there's a flex stacker in the cutout
 * @param cutoutId: the cutout ID
 * @param deckConfigWithAA: current deck configuration
 * @returns replacement fixture info or null if no replacement needed
 */
const getWasteChuteFixtureReplacement = (
  cutoutFixtureId: CutoutFixtureIdsWithFakes,
  wasteChuteFixture: CutoutFixtureIdsWithFakes | null,
  hasFlexStacker: boolean,
  cutoutId: CutoutId,
  deckConfigWithAA: CutoutConfigMap[]
): {
  comboFixtureId: CutoutFixtureId
  comboOpentronsModuleSerialNumber?: string
} | null => {
  // Define fixture mapping rules
  const fixtureMapping = [
    {
      condition:
        cutoutFixtureId === FLEX_STACKER_MODULE_V1 &&
        wasteChuteFixture === WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      comboOpentronsModuleSerialNumber: undefined,
    },
    {
      condition:
        cutoutFixtureId === FLEX_STACKER_MODULE_V1 &&
        wasteChuteFixture === FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      comboOpentronsModuleSerialNumber: undefined,
    },
    {
      condition:
        cutoutFixtureId === FLEX_STACKER_MODULE_V1 &&
        wasteChuteFixture === FAKE_WASTE_CHUTE_WITH_EMPTY_SLOT_FIXTURE,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      comboOpentronsModuleSerialNumber: deckConfigWithAA.find(
        dc =>
          dc.cutoutId === cutoutId &&
          dc.cutoutFixtureId === FLEX_STACKER_MODULE_V1
      )?.opentronsModuleSerialNumber,
    },
    {
      condition:
        cutoutFixtureId === FLEX_STACKER_MODULE_V1 &&
        wasteChuteFixture === WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
      comboOpentronsModuleSerialNumber: undefined,
    },
    {
      condition:
        cutoutFixtureId === WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE &&
        hasFlexStacker,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
      comboOpentronsModuleSerialNumber: deckConfigWithAA.find(
        dc =>
          dc.cutoutId === cutoutId &&
          dc.cutoutFixtureId === FLEX_STACKER_MODULE_V1
      )?.opentronsModuleSerialNumber,
    },
    {
      condition:
        cutoutFixtureId === WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE &&
        hasFlexStacker,
      comboFixtureId: FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
      comboOpentronsModuleSerialNumber: deckConfigWithAA.find(
        dc =>
          dc.cutoutId === cutoutId &&
          dc.cutoutFixtureId === FLEX_STACKER_MODULE_V1
      )?.opentronsModuleSerialNumber,
    },
  ]

  // Find the first matching rule and return the replacement info
  const matchingRule = fixtureMapping.find(rule => rule.condition)
  if (matchingRule) {
    return {
      comboFixtureId: matchingRule.comboFixtureId,
      comboOpentronsModuleSerialNumber:
        matchingRule.comboOpentronsModuleSerialNumber,
    }
  }

  return null
}

/**
 * Create a combo fixture configuration
 */
const createComboFixture = (
  cutoutId: CutoutId,
  comboFixtureId: CutoutFixtureId,
  serialNumber?: string
): CutoutConfig => ({
  cutoutId,
  cutoutFixtureId: comboFixtureId,
  opentronsModuleSerialNumber: serialNumber,
})

/**
 * Determine the appropriate combo fixture for waste chute cutout
 */
export const getWasteChuteComboFixture = (
  aaCutoutItem: CutoutConfigMap,
  deckConfigWithAA: CutoutConfigMap[]
): CutoutConfig | null => {
  const { cutoutId, cutoutFixtureId, opentronsModuleSerialNumber } =
    aaCutoutItem
  // Check if this is a valid waste chute cutout with compatible fixtures
  if (
    cutoutId !== WASTE_CHUTE_CUTOUT ||
    (cutoutFixtureId !== FLEX_STACKER_V1_FIXTURE &&
      !WASTE_CHUTE_ONLY_FIXTURES_WITH_FAKES.includes(cutoutFixtureId))
  ) {
    return null
  }

  const wasteChuteFixture = getWasteChuteFixtureType(deckConfigWithAA, cutoutId)
  const hasFlexStacker = hasFlexStackerFixture(deckConfigWithAA, cutoutId)

  // Find the replacement fixture
  const replacementInfo = getWasteChuteFixtureReplacement(
    cutoutFixtureId,
    wasteChuteFixture,
    hasFlexStacker,
    cutoutId,
    deckConfigWithAA
  )

  if (replacementInfo) {
    return createComboFixture(
      cutoutId,
      replacementInfo.comboFixtureId,
      opentronsModuleSerialNumber ??
        replacementInfo.comboOpentronsModuleSerialNumber
    )
  }

  return null
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
): CutoutConfig[] => {
  const addressableAreasById = getAAsToFixtureIdFromDeckDefWithFakes(
    cutoutId,
    getDeckDefFromRobotType('OT-3 Standard')
  )

  return addedCutoutConfigs.map(aaCutoutItem => {
    // Handle waste chute combo fixtures
    const wasteChuteCombo = getWasteChuteComboFixture(
      aaCutoutItem,
      deckConfigWithAA
    )
    if (wasteChuteCombo) {
      return wasteChuteCombo
    }

    // Handle thermocycler module fixtures
    if (
      THERMOCYCLER_MODULE_CUTOUTS.includes(cutoutId) &&
      MODULE_FIXTURES_BY_MODEL.thermocyclerModuleV2?.includes(
        aaCutoutItem.cutoutFixtureId as CutoutFixtureId
      )
    ) {
      return {
        cutoutFixtureId: getReplacementFixtureForFakeFixture(
          aaCutoutItem.cutoutFixtureId
        ) as CutoutFixtureId,
        cutoutId: aaCutoutItem.cutoutId,
        opentronsModuleSerialNumber: aaCutoutItem.opentronsModuleSerialNumber,
      }
    }

    // Handle vacuum module fixtures
    if (
      cutoutId === VACUUM_MODULE_CUTOUT &&
      MODULE_FIXTURES_BY_MODEL[VACUUM_MODULE_V1]?.includes(
        aaCutoutItem.cutoutFixtureId as CutoutFixtureId
      )
    ) {
      return {
        cutoutFixtureId: getReplacementFixtureForFakeFixture(
          aaCutoutItem.cutoutFixtureId
        ) as CutoutFixtureId,
        cutoutId: aaCutoutItem.cutoutId,
        opentronsModuleSerialNumber: aaCutoutItem.opentronsModuleSerialNumber,
      }
    }

    // Filter potential combo fixture options
    const comboFixturesOptions = Object.entries(addressableAreasById).filter(
      ([_, areaIds]) => areaIds.includes(aaCutoutItem.addressableAreaId)
    )
    // Try to match with deck config
    for (const dc of deckConfigWithAA) {
      const match = comboFixturesOptions.find(([, areaIds]) =>
        areaIds.includes(dc.addressableAreaId)
      )
      if (match) {
        if (match[0] === aaCutoutItem.cutoutFixtureId) {
          return {
            cutoutFixtureId: getReplacementFixtureForFakeFixture(
              aaCutoutItem.cutoutFixtureId
            ) as CutoutFixtureId,
            cutoutId: aaCutoutItem.cutoutId,
            opentronsModuleSerialNumber:
              aaCutoutItem.opentronsModuleSerialNumber,
          }
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
        console.log(
          'Invalid deck config match for:',
          aaCutoutItem.cutoutFixtureId
        )
        continue
      }
    }
    // Fallback if no match found
    return {
      cutoutFixtureId: getReplacementFixtureForFakeFixture(
        aaCutoutItem.cutoutFixtureId
      ) as CutoutFixtureId,
      cutoutId: aaCutoutItem.cutoutId,
      opentronsModuleSerialNumber: aaCutoutItem.opentronsModuleSerialNumber,
    }
  })
}
/**
 * Check if a flex stacker module can be placed in the D3 cutout with waste chute compatibility
 * @param deckConfigCompatibility: array of deck configuration compatibility items
 * @returns object with combo fixture ID and conflict status, or null if not compatible
 */
export const getFlexStackerD3Compatibility = (
  deckConfigCompatibility: CutoutConfigAndCompatibility[] | undefined
): {
  comboFixtureId: CutoutFixtureId | undefined
  comboFixtureConflict: boolean
} | null => {
  const deckConfigCompatabilityD3 = deckConfigCompatibility?.find(
    configItem => configItem.cutoutId === WASTE_CHUTE_CUTOUT
  )
  const matchWithAA = getMainFixtureIdForAA(
    deckConfigCompatabilityD3?.compatibleCutoutFixtureIds ?? [],
    deckConfigCompatabilityD3?.requiredAddressableAreas ?? [],
    'cutoutD3'
  )
  const matchWithFixture =
    matchWithAA ?? deckConfigCompatabilityD3?.compatibleCutoutFixtureIds[0]
  if (
    deckConfigCompatabilityD3 != null &&
    matchWithFixture !== undefined &&
    WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(
      matchWithFixture as CutoutFixtureIdsWithFakes
    )
  ) {
    if (
      !matchWithAA &&
      WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(
        deckConfigCompatabilityD3.cutoutFixtureId as CutoutFixtureIdsWithFakes
      )
    ) {
      return {
        comboFixtureId:
          deckConfigCompatabilityD3.cutoutFixtureId as CutoutFixtureId,
        comboFixtureConflict:
          !deckConfigCompatabilityD3?.compatibleCutoutFixtureIds.includes(
            deckConfigCompatabilityD3.cutoutFixtureId
          ),
      }
    }

    const comboFixtureId =
      deckConfigCompatabilityD3?.compatibleCutoutFixtureIds.find(
        fixtureId => !fixtureId.startsWith('fake')
      ) as CutoutFixtureId | undefined

    const comboFixtureConflict =
      !deckConfigCompatabilityD3?.compatibleCutoutFixtureIds.includes(
        deckConfigCompatabilityD3.cutoutFixtureId
      )

    return {
      comboFixtureId,
      comboFixtureConflict,
    }
  }

  return null
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

export const getCutoutConfigReplacmentForModule = (
  cutoutId: CutoutId,
  fixtureId: CutoutFixtureId,
  moduleModel: ModuleModel,
  deckConfig: CutoutConfig[]
): CutoutFixtureId => {
  const deckConfigWithAA =
    replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig)
  const mainAA = getAAForModuleFixture(cutoutId, fixtureId, moduleModel)
  const addedCutoutConfigs: CutoutConfigMap[] = [
    {
      addressableAreaId: mainAA,
      cutoutFixtureId: fixtureId,
      cutoutId: cutoutId,
    },
  ]
  const replacmentFixture = replaceCutoutFixtureWithComboFixture(
    addedCutoutConfigs,
    deckConfigWithAA,
    cutoutId
  )

  return getReplacementFixtureForFakeFixture(
    replacmentFixture[0].cutoutFixtureId
  )
}

// Check if thermocycler fixtures need the missing fixture added
export const getAddedMissingThermocyclerFixtures = (
  values: CutoutConfigMap[],
  deckDef: DeckDefinition
): CutoutConfigMap[] => {
  const thermocyclerFixtures = MODULE_FIXTURES_BY_MODEL[THERMOCYCLER_MODULE_V2]
  const hasThermocyclerFixture = values.some(v =>
    thermocyclerFixtures?.includes(v.cutoutFixtureId as CutoutFixtureId)
  )

  if (!hasThermocyclerFixture || thermocyclerFixtures == null) {
    return values
  }

  const missingFixtures = thermocyclerFixtures.reduce<CutoutConfigMap[]>(
    (acc, fixtureId) => {
      const alreadyExists = values.some(v => v.cutoutFixtureId === fixtureId)
      if (alreadyExists) {
        return acc
      }

      const fixtureFromDeckDef = deckDef.cutoutFixtures.find(
        fixture => fixture.id === fixtureId
      )
      const cutoutId = fixtureFromDeckDef?.mayMountTo[0]
      if (cutoutId == null || fixtureFromDeckDef == null) {
        return acc
      }

      // Get addressable area from providesAddressableAreas using the cutoutId
      const addressableArea =
        fixtureFromDeckDef.providesAddressableAreas[cutoutId]?.[0]

      return [
        ...acc,
        {
          cutoutId,
          cutoutFixtureId: fixtureId as CutoutFixtureId,
          addressableAreaId: (addressableArea ??
            cutoutId.replace('cutout', '')) as AddressableAreaNamesWithFakes,
        },
      ]
    },
    []
  )

  return [...values, ...missingFixtures]
}
