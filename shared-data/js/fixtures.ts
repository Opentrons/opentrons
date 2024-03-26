import {
  FLEX_ROBOT_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
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
  HEATERSHAKER_MODULE_V1_FIXTURE,
  HEATERSHAKER_MODULE_V1,
  TEMPERATURE_MODULE_V2_FIXTURE,
  TEMPERATURE_MODULE_V2,
  MAGNETIC_BLOCK_V1_FIXTURE,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_V2_REAR_FIXTURE,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  MODULE_FIXTURES_BY_MODEL,
} from './constants'
import type {
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
  FlexModuleCutoutFixtureId,
  OT2CutoutId,
} from '../deck'
import type {
  AddressableArea,
  CoordinateTuple,
  DeckDefinition,
  ModuleModel,
} from './types'
import type { LoadModuleCreateCommand, ModuleLocation } from '../command'
import { getModuleDisplayName } from './modules'

export function getCutoutDisplayName(cutout: CutoutId): string {
  return cutout.replace('cutout', '')
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

export function getCutoutFixtureIdsForModuleModel(
  moduleModel: ModuleModel
): FlexModuleCutoutFixtureId[] {
  const moduleFixtures = MODULE_FIXTURES_BY_MODEL[moduleModel]
  return moduleFixtures ?? []
}

export function getCutoutIdFromModuleLocation(
  location: ModuleLocation,
  deckDef: DeckDefinition
): CutoutId | null {
  return (
    deckDef.locations.cutouts.find(cutout =>
      cutout.id.includes(location.slotName)
    )?.id ?? null
  )
}

export function getAddressableAreaNamesFromLoadedModule(
  params: LoadModuleCreateCommand['params'],
  deckDef: DeckDefinition
): AddressableAreaName[] {
  const moduleFixtureIds = getCutoutFixtureIdsForModuleModel(params.model)
  const cutoutId = getCutoutIdFromModuleLocation(params.location, deckDef)
  return moduleFixtureIds.reduce<AddressableAreaName[]>(
    (acc, cutoutFixtureId) => {
      const cutoutFixture =
        deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId) ?? null
      const providedAddressableAreas =
        cutoutId != null
          ? cutoutFixture?.providesAddressableAreas[cutoutId] ?? []
          : []
      return [...acc, ...providedAddressableAreas]
    },
    []
  )
}

export function getFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureId | null
): string {
  switch (cutoutFixtureId) {
    case STAGING_AREA_RIGHT_SLOT_FIXTURE:
      return 'Staging area slot'
    case TRASH_BIN_ADAPTER_FIXTURE:
      return 'Trash bin'
    case WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return 'Waste chute only'
    case WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return 'Waste chute only with cover'
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE:
      return 'Waste chute with staging area slot'
    case STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE:
      return 'Waste chute with staging area slot and cover'
    case HEATERSHAKER_MODULE_V1_FIXTURE:
      return getModuleDisplayName(HEATERSHAKER_MODULE_V1)
    case TEMPERATURE_MODULE_V2_FIXTURE:
      return getModuleDisplayName(TEMPERATURE_MODULE_V2)
    case MAGNETIC_BLOCK_V1_FIXTURE:
      return getModuleDisplayName(MAGNETIC_BLOCK_V1)
    case THERMOCYCLER_V2_REAR_FIXTURE:
      return getModuleDisplayName(THERMOCYCLER_MODULE_V2)
    case THERMOCYCLER_V2_FRONT_FIXTURE:
      return getModuleDisplayName(THERMOCYCLER_MODULE_V2)
    default:
      return 'Slot'
  }
}

const STANDARD_OT2_SLOTS: AddressableAreaName[] = [
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

const STANDARD_FLEX_SLOTS: AddressableAreaName[] = [
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
