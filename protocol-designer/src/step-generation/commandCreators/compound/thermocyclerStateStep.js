// @flow
import { thermocyclerStateDiff } from '../../utils/thermocyclerStateDiff'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import * as errorCreators from '../../errorCreators'
import { thermocyclerDeactivateBlock } from '../atomic/thermocyclerDeactivateBlock'
import { thermocyclerSetTargetBlockTemperature } from '../atomic/thermocyclerSetTargetBlockTemperature'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerOpenLid } from '../atomic/thermocyclerOpenLid'
import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerStateStepArgs,
} from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerDeactivateLid } from '../atomic/thermocyclerDeactivateLid'

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

  let commandCreators: Array<CurriedCommandCreator> = []

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

  if (args.blockTargetTemp !== null && setBlockTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetBlockTemperature, {
        module: args.module,
        temperature: args.blockTargetTemp,
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

  if (args.lidTargetTemp !== null && setLidTemperature) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetLidTemperature, {
        module: args.module,
        temperature: args.lidTargetTemp,
      })
    )
  }

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
