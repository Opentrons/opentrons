import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
} from '../commandCreators/atomic'
import { curryCommandCreator } from './curryCommandCreator'
import type { AddressableAreaName, CutoutId } from '@opentrons/shared-data'
import type {
  RobotState,
  InvariantContext,
  CurriedCommandCreator,
} from '../types'

export type MovableTrashCommandsTypes =
  | 'airGap'
  | 'blowOut'
  | 'dispense'
  | 'dropTip'
  | 'moveToWell'

interface MovableTrashCommandArgs {
  type: MovableTrashCommandsTypes
  pipetteId: string
  invariantContext: InvariantContext
  prevRobotState?: RobotState
  volume?: number
  flowRate?: number
}
/** Helper fn for movable trash commands for dispense, aspirate, air_gap, drop_tip and blow_out commands */
export const movableTrashCommandsUtil = (
  args: MovableTrashCommandArgs
): CurriedCommandCreator[] => {
  const {
    pipetteId,
    type,
    invariantContext,
    prevRobotState,
    volume,
    flowRate,
  } = args
  const trash = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'trashBin')
  const trashLocation = trash != null ? (trash.location as CutoutId) : null

  const deckDef = getDeckDefFromRobotType(
    trashLocation === ('cutout12' as CutoutId)
      ? OT2_ROBOT_TYPE
      : FLEX_ROBOT_TYPE
  )
  let cutouts: Record<CutoutId, AddressableAreaName[]> | null = null
  if (deckDef.robot.model === FLEX_ROBOT_TYPE) {
    cutouts =
      deckDef.cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === 'trashBinAdapter'
      )?.providesAddressableAreas ?? null
  } else if (deckDef.robot.model === OT2_ROBOT_TYPE) {
    cutouts =
      deckDef.cutoutFixtures.find(
        cutoutFixture => cutoutFixture.id === 'fixedTrashSlot'
      )?.providesAddressableAreas ?? null
  }

  const addressableAreaName = (trashLocation != null && cutouts != null
    ? cutouts[trashLocation] ?? ['']
    : [''])[0]

  if (addressableAreaName === '') {
    console.error(
      `expected to find addressableAreaName with trashLocation ${trashLocation} but could not`
    )
  }

  let inPlaceCommands: CurriedCommandCreator[] = []

  switch (type) {
    case 'airGap': {
      inPlaceCommands =
        flowRate != null && volume != null
          ? [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(aspirateInPlace, {
                pipetteId,
                volume,
                flowRate,
              }),
            ]
          : []

      break
    }
    case 'dropTip': {
      inPlaceCommands =
        prevRobotState != null && !prevRobotState.tipState.pipettes[pipetteId]
          ? []
          : [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(dropTipInPlace, {
                pipetteId,
              }),
            ]

      break
    }
    case 'dispense': {
      inPlaceCommands =
        flowRate != null && volume != null
          ? [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(dispenseInPlace, {
                pipetteId,
                volume,
                flowRate,
              }),
            ]
          : []
      break
    }
    case 'blowOut': {
      inPlaceCommands =
        flowRate != null
          ? [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(blowOutInPlace, {
                pipetteId,
                flowRate,
              }),
            ]
          : []
      break
    }
    case 'moveToWell': {
      inPlaceCommands = [
        curryCommandCreator(moveToAddressableArea, {
          pipetteId,
          addressableAreaName,
        }),
      ]
    }
  }
  return inPlaceCommands
}
