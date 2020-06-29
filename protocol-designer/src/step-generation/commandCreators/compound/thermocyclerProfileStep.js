// @flow
import * as errorCreators from '../../errorCreators'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerProfileStepArgs,
} from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerAwaitLidTemperature } from '../atomic/thermocyclerAwaitLidTemperature'
import { thermocyclerAwaitProfileComplete } from '../atomic/thermocyclerAwaitProfileComplete'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerRunProfile } from '../atomic/thermocyclerRunProfile'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerStateStep } from './thermocyclerStateStep'

export const thermocyclerProfileStep: CommandCreator<ThermocyclerProfileStepArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    blockTargetTempHold,
    lidTargetTempHold,
    lidOpenHold,
    module: moduleId,
    profileSteps,
    profileTargetLidTemp,
    profileVolume,
  } = args
  const thermocyclerState = thermocyclerStateGetter(prevRobotState, moduleId)

  if (thermocyclerState === null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  const commandCreators: Array<CurriedCommandCreator> = []

  if (thermocyclerState.lidOpen !== false) {
    commandCreators.push(
      curryCommandCreator(thermocyclerCloseLid, {
        module: moduleId,
      })
    )
  }

  if (profileTargetLidTemp !== thermocyclerState.lidTargetTemp) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetLidTemperature, {
        module: moduleId,
        temperature: profileTargetLidTemp,
      })
    )
    commandCreators.push(
      curryCommandCreator(thermocyclerAwaitLidTemperature, {
        module: moduleId,
        temperature: profileTargetLidTemp,
      })
    )
  }

  commandCreators.push(
    curryCommandCreator(thermocyclerRunProfile, {
      module: moduleId,
      profile: profileSteps,
      volume: profileVolume,
    })
  )

  commandCreators.push(
    curryCommandCreator(thermocyclerAwaitProfileComplete, {
      module: moduleId,
    })
  )

  commandCreators.push(
    curryCommandCreator(thermocyclerStateStep, {
      commandCreatorFnName: 'thermocyclerState',
      module: moduleId,
      blockTargetTemp: blockTargetTempHold,
      lidTargetTemp: lidTargetTempHold,
      lidOpen: lidOpenHold,
    })
  )

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
