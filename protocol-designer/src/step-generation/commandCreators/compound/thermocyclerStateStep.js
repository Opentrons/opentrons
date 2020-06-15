// @flow
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerStateDiff } from '../../utils/thermocyclerStateDiff'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import { thermocyclerAwaitBlockTemperature } from '../atomic/thermocyclerAwaitBlockTemperature'
import { thermocyclerAwaitLidTemperature } from '../atomic/thermocyclerAwaitLidTemperature'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerDeactivateBlock } from '../atomic/thermocyclerDeactivateBlock'
import { thermocyclerDeactivateLid } from '../atomic/thermocyclerDeactivateLid'
import { thermocyclerOpenLid } from '../atomic/thermocyclerOpenLid'
import { thermocyclerSetTargetBlockTemperature } from '../atomic/thermocyclerSetTargetBlockTemperature'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerStateStepArgs,
} from '../../types'

export const thermocyclerStateStep: CommandCreator<ThermocyclerStateStepArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const thermocyclerState = thermocyclerStateGetter(prevRobotState, args.module)

  if (thermocyclerState === null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  const {
    lidOpen,
    lidClosed,
    setBlockTemperature,
    deactivateBlockTemperature,
    setLidTemperature,
    deactivateLidTemperature,
  } = thermocyclerStateDiff(thermocyclerState, args)

  const { blockTargetTemp, lidTargetTemp } = args

  const commandCreators: Array<CurriedCommandCreator> = []

  if (lidOpen) {
    commandCreators.push(
      curryCommandCreator(thermocyclerOpenLid, { module: args.module })
    )
  }
  if (lidClosed) {
    commandCreators.push(
      curryCommandCreator(thermocyclerCloseLid, { module: args.module })
    )
  }

  if (deactivateBlockTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerDeactivateBlock, {
        module: args.module,
      })
    )
  }

  if (blockTargetTemp !== null && setBlockTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetBlockTemperature, {
        module: args.module,
        temperature: blockTargetTemp,
      })
    )
    commandCreators.push(
      curryCommandCreator(thermocyclerAwaitBlockTemperature, {
        module: args.module,
        temperature: blockTargetTemp,
      })
    )
  }

  if (deactivateLidTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerDeactivateLid, {
        module: args.module,
      })
    )
  }

  if (lidTargetTemp !== null && setLidTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetLidTemperature, {
        module: args.module,
        temperature: lidTargetTemp,
      })
    )
    commandCreators.push(
      curryCommandCreator(thermocyclerAwaitLidTemperature, {
        module: args.module,
        temperature: lidTargetTemp,
      })
    )
  }

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
