import {
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

export type WasteChuteCommandsTypes = 'dispense' | 'blow out' | 'drop tip'

interface WasteChuteCommandArgs {
  type: WasteChuteCommandsTypes
  pipetteId: string
  addressableAreaName: string
  volume?: number
  flowRate?: number
}
/** Helper fn for waste chute dispense, drop tip and blow_out commands */
export const wasteChuteCommandsUtil: CommandCreator<WasteChuteCommandArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, addressableAreaName, type, volume, flowRate } = args
  const errors: CommandCreatorError[] = []
  const pipetteName = invariantContext.pipetteEntities[pipetteId]?.name
  const hasWasteChute = getHasWasteChute(
    invariantContext.additionalEquipmentEntities
  )

  if (pipetteName == null) {
    errors.push(
      errorCreators.pipetteDoesNotExist({
        actionName: type,
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

  let commands: CurriedCommandCreator[] = []
  switch (type) {
    case 'drop tip': {
      commands = [
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
    case 'blow out': {
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
