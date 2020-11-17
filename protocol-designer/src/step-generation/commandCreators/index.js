// @flow
import { memoize } from 'lodash'
import {
  transfer as _transfer,
  mix as _mix,
  consolidate as _consolidate,
  distribute as _distribute,
  thermocyclerProfileStep as _thermocyclerProfileStep,
  thermocyclerStateStep as _thermocyclerStateStep,
} from './compound'

import type {
  CommandCreator,
  ConsolidateArgs,
  DistributeArgs,
  MixArgs,
  ThermocyclerProfileStepArgs,
  ThermocyclerStateStepArgs,
  TransferArgs,
} from '../types'

export {
  aspirate,
  awaitTemperature,
  blowout,
  deactivateTemperature,
  delay,
  disengageMagnet,
  dispense,
  dropAllTips,
  dropTip,
  engageMagnet,
  replaceTip,
  setTemperature,
  touchTip,
} from './atomic'

const resolver = (args, invariantContext, prevRobotState) =>
  `${JSON.stringify(args)}${JSON.stringify(invariantContext)}${JSON.stringify(
    prevRobotState
  )}`

export const transfer: CommandCreator<TransferArgs> = memoize(
  _transfer,
  resolver
)
export const mix: CommandCreator<MixArgs> = memoize(_mix, resolver)
export const consolidate: CommandCreator<ConsolidateArgs> = memoize(
  _consolidate,
  resolver
)
export const distribute: CommandCreator<DistributeArgs> = memoize(
  _distribute,
  resolver
)
export const thermocyclerProfileStep: CommandCreator<ThermocyclerProfileStepArgs> = memoize(
  _thermocyclerProfileStep,
  resolver
)
export const thermocyclerStateStep: CommandCreator<ThermocyclerStateStepArgs> = memoize(
  _thermocyclerStateStep,
  resolver
)
