import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
} from '../commandCreators/atomic'
import * as errorCreators from '../errorCreators'
import { getHasWasteChute } from './misc'
import { reduceCommandCreators } from './reduceCommandCreators'
import { curryCommandCreator } from './curryCommandCreator'
import type {
  CommandCreator,
  CommandCreatorError,
  CurriedCommandCreator,
} from '../types'

export type WasteChuteCommandsTypes =
  | 'dispense'
  | 'blowOut'
  | 'dropTip'
  | 'airGap'

interface WasteChuteCommandArgs {
  type: WasteChuteCommandsTypes
  pipetteId: string
  addressableAreaName: string
  isGantryAtAddressableArea: boolean
  volume?: number
  flowRate?: number
}
/** Helper fn for waste chute dispense, drop tip and blow_out commands */
export const wasteChuteCommandsUtil: CommandCreator<WasteChuteCommandArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    pipetteId,
    addressableAreaName,
    type,
    isGantryAtAddressableArea,
    volume,
    flowRate,
  } = args
  const errors: CommandCreatorError[] = []
  const pipetteName = invariantContext.pipetteEntities[pipetteId]?.name
  const hasWasteChute = getHasWasteChute(
    invariantContext.additionalEquipmentEntities
  )

  const addressableAreaCommand: CurriedCommandCreator[] = isGantryAtAddressableArea
    ? []
    : [
        curryCommandCreator(moveToAddressableArea, {
          pipetteId,
          addressableAreaName,
        }),
      ]

  let actionName = 'dispense'
  if (type === 'blowOut') {
    actionName = 'blow out'
  } else if (type === 'dropTip') {
    actionName = 'drop tip'
  } else if (type === 'airGap') {
    actionName = 'air gap'
  }

  if (pipetteName == null) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName,
        pipette: pipetteId,
      })
    )
  }
  if (!hasWasteChute) {
    errors.push(
      errorCreators.additionalEquipmentDoesNotExist({
        additionalEquipment: 'Waste chute',
      })
    )
  }

  let inPlaceCommands: CurriedCommandCreator[] = []
  switch (type) {
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
    case 'airGap': {
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
  }

  if (errors.length > 0)
    return {
      errors,
    }
  const allCommands = [...addressableAreaCommand, ...inPlaceCommands]
  return reduceCommandCreators(allCommands, invariantContext, prevRobotState)
}
