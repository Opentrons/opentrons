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
  RobotType,
} from './types'

export function getCutoutDisplayName(cutout: Cutout): string {
  return cutout.replace('cutout', '')
}

// TODO: update types for OT-2
// returns the cutout associated with a slot id
export function getCutoutFromSlotId(
  slotId: string,
  robotType: RobotType
): Cutout {
  // TODO: rewrite to mapping not parsing
  const cutout = 'cutout'.concat(slotId)

  if (robotType === FLEX_ROBOT_TYPE) {
    // for flex,r eplace 4 with 3 e.g. B4 -> B3 because staging area slots 4 are always in cutouts 3
    cutout.replace('4', '3')
  }
  return cutout as Cutout
}

// returns the position associated with a slot id
export function getPositionFromSlotId(
  slotId: string,
  deckDef: DeckDefinition
): CoordinateTuple | null {
  const cutoutWithSlot = getCutoutFromSlotId(slotId, deckDef.robot.model)

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
