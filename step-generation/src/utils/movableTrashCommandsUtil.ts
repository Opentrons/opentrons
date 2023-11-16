import {
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
} from '../commandCreators/atomic'
import * as errorCreators from '../errorCreators'
import { reduceCommandCreators } from './reduceCommandCreators'
import { FLEX_TRASH_DEF_URI, OT_2_TRASH_DEF_URI } from '../constants'
import { curryCommandCreator } from './curryCommandCreator'
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
/** Helper fn for waste chute dispense, drop tip and blow_out commands */
export const movableTrashCommandsUtil: CommandCreator<MovableTrashCommandArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, type, volume, flowRate } = args
  const errors: CommandCreatorError[] = []
  const pipetteName = invariantContext.pipetteEntities[pipetteId]?.name
  const trashId = Object.values(invariantContext.labwareEntities).find(
    labware =>
      labware.labwareDefURI === FLEX_TRASH_DEF_URI ||
      labware.labwareDefURI === OT_2_TRASH_DEF_URI
  )?.id
  const trashLocation =
    trashId != null ? prevRobotState.labware[trashId].slot : null
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

  let commands: CurriedCommandCreator[] = []
  switch (type) {
    case 'dropTip': {
      commands = !prevRobotState.tipState.pipettes[pipetteId]
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
      commands =
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
      commands =
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
  }

  if (errors.length > 0)
    return {
      errors,
    }

  return reduceCommandCreators(commands, invariantContext, prevRobotState)
}
