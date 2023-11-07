import {
  FLEX_ROBOT_TYPE,
  STAGING_AREA_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from './constants'
import type {
  CoordinateTuple,
  Cutout,
  DeckDefinition,
  FixtureLoadName,
  OT2Cutout,
} from './types'

export function getCutoutDisplayName(cutout: Cutout): string {
  return cutout.replace('cutout', '')
}

// mapping of OT-2 deck slots to cutouts
const OT2_CUTOUT_BY_SLOT_ID: { [slotId: string]: OT2Cutout } = {
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
const FLEX_CUTOUT_BY_SLOT_ID: { [slotId: string]: Cutout } = {
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
  const offsetFromCutoutFixture = deckDef.locations.addressableAreas.find(
    addressableArea => addressableArea.id === slotId
  )?.offsetFromCutoutFixture ?? [0, 0, 0]

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

export function getFixtureDisplayName(loadName: FixtureLoadName): string {
  if (loadName === STAGING_AREA_LOAD_NAME) {
    return 'Staging Area Slot'
  } else if (loadName === TRASH_BIN_LOAD_NAME) {
    return 'Trash Bin'
  } else if (loadName === WASTE_CHUTE_LOAD_NAME) {
    return 'Waste Chute'
  } else {
    return 'Slot'
  }
}
