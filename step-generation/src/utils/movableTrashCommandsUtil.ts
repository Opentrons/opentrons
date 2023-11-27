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
import * as errorCreators from '../errorCreators'
import { reduceCommandCreators } from './reduceCommandCreators'
import { curryCommandCreator } from './curryCommandCreator'
import type { AddressableAreaName, CutoutId } from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
} from '../types'

export type MovableTrashCommandsTypes =
  | 'airGap'
  | 'aspirate'
  | 'blowOut'
  | 'dispense'
  | 'dropTip'

interface MovableTrashCommandArgs {
  type: MovableTrashCommandsTypes
  pipetteId: string
  volume?: number
  flowRate?: number
}
/** Helper fn for movable trash commands for dispense, aspirate, air_gap, drop_tip and blow_out commands */
export const movableTrashCommandsUtil: CommandCreator<MovableTrashCommandArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, type, volume, flowRate } = args
  const errors: CommandCreatorError[] = []
  const pipetteName = invariantContext.pipetteEntities[pipetteId]?.name
  const trash = Object.values(
    invariantContext.additionalEquipmentEntities
  ).find(aE => aE.name === 'trashBin')

  const trashLocation = trash != null ? (trash.location as CutoutId) : null

  let actionName: string = ''
  switch (type) {
    case 'blowOut':
      actionName = 'blow out'
      break
    case 'dropTip':
      actionName = 'drop tip'
      break
    case 'airGap':
      actionName = 'air gap'
      break
    case 'aspirate':
      actionName = 'aspirate'
      break
    case 'dispense':
      actionName = 'dispense'
      break
    default:
      break
  }

  if (pipetteName == null) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette: pipetteId,
      })
    )
  }
  if (trashLocation == null) {
    errors.push(
      errorCreators.additionalEquipmentDoesNotExist({
        additionalEquipment: 'Trash bin',
      })
    )
  }

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

  const addressableAreaCommand: CurriedCommandCreator[] = [
    curryCommandCreator(moveToAddressableArea, {
      pipetteId,
      addressableAreaName,
    }),
  ]

  let inPlaceCommands: CurriedCommandCreator[] = []
  switch (type) {
    case 'airGap':
    case 'aspirate': {
      inPlaceCommands =
        flowRate != null && volume != null
          ? [
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
      inPlaceCommands = !prevRobotState.tipState.pipettes[pipetteId]
        ? []
        : [
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
              curryCommandCreator(blowOutInPlace, {
                pipetteId,
                flowRate,
              }),
            ]
          : []
      break
    }
  }

  if (errors.length > 0)
    return {
      errors,
    }

  const allCommands = [...addressableAreaCommand, ...inPlaceCommands]

  return reduceCommandCreators(allCommands, invariantContext, prevRobotState)
}
