import {
  FLEX_ROBOT_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from './constants'
import type { CutoutFixtureId } from '../deck'
import type {
  AddressableArea,
  CoordinateTuple,
  Cutout,
  DeckDefinition,
  OT2Cutout,
} from './types'

export function getCutoutDisplayName(cutout: Cutout): string {
  return cutout.replace('cutout', '')
}

// mapping of OT-2 deck slots to cutouts
export const OT2_CUTOUT_BY_SLOT_ID: { [slotId: string]: OT2Cutout } = {
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
}

// mapping of Flex deck slots to cutouts
export const FLEX_CUTOUT_BY_SLOT_ID: { [slotId: string]: Cutout } = {
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

export function getFixtureDisplayName(
  cutoutFixtureId: CutoutFixtureId | null
): string {
  if (cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE) {
    return 'Staging area slot'
  } else if (cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE) {
    return 'Trash bin'
  } else if (cutoutFixtureId === WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE) {
    return 'Waste chute only'
  } else if (cutoutFixtureId === WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE) {
    return 'Waste chute only covered'
  } else if (
    cutoutFixtureId ===
    STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
  ) {
    return 'Waste chute with staging area slot'
  } else if (
    cutoutFixtureId ===
    STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE
  ) {
    return 'Waste chute with staging area slot covered'
  } else {
    return 'Slot'
  }
}

const STANDARD_OT2_SLOTS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
]

const STANDARD_FLEX_SLOTS = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3',
  'C1',
  'C2',
  'C3',
  'D1',
  'D2',
  'D3',
]

export const isAddressableAreaStandardSlot = (
  addressableAreaId: string,
  deckDef: DeckDefinition
): boolean =>
  (deckDef.robot.model === FLEX_ROBOT_TYPE
    ? STANDARD_FLEX_SLOTS
    : STANDARD_OT2_SLOTS
  ).includes(addressableAreaId)
