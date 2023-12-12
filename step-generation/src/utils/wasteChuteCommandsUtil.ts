import {
  aspirateInPlace,
  blowOutInPlace,
  dispenseInPlace,
  dropTipInPlace,
  moveToAddressableArea,
} from '../commandCreators/atomic'
import { curryCommandCreator } from './curryCommandCreator'
import type { RobotState, CurriedCommandCreator } from '../types'

export type WasteChuteCommandsTypes =
  | 'dispense'
  | 'blowOut'
  | 'dropTip'
  | 'airGap'

interface WasteChuteCommandArgs {
  type: WasteChuteCommandsTypes
  pipetteId: string
  addressableAreaName: string
  prevRobotState: RobotState
  volume?: number
  flowRate?: number
}
/** Helper fn for waste chute dispense, drop tip and blow_out commands */
export const wasteChuteCommandsUtil = (
  args: WasteChuteCommandArgs
): CurriedCommandCreator[] => {
  const {
    pipetteId,
    addressableAreaName,
    type,
    prevRobotState,
    volume,
    flowRate,
  } = args

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
    case 'airGap': {
      commands =
        flowRate != null && volume != null
          ? [
              curryCommandCreator(moveToAddressableArea, {
                pipetteId,
                addressableAreaName,
              }),
              curryCommandCreator(aspirateInPlace, {
                pipetteId,
                flowRate,
                volume,
              }),
            ]
          : []
      break
    }
  }

  return commands
}
