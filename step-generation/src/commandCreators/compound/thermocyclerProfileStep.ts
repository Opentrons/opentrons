import * as errorCreators from '../../errorCreators'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerRunExtendedProfile } from '../atomic/thermocyclerRunExtendedProfile'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerStateStep } from './thermocyclerStateStep'

import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerProfileStepArgs,
} from '../../types'

export const thermocyclerProfileStep: CommandCreator<
  ThermocyclerProfileStepArgs
> = (args, invariantContext, prevRobotState) => {
  const {
    blockTargetTempHold,
    lidTargetTempHold,
    lidOpenHold,
    moduleId,
    profileElements,
    profileTargetLidTemp,
    profileVolume,
  } = args
  const thermocyclerState = thermocyclerStateGetter(prevRobotState, moduleId)

  if (thermocyclerState === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const commandCreators: CurriedCommandCreator[] = []

  if (thermocyclerState.lidOpen !== false) {
    commandCreators.push(
      curryCommandCreator(thermocyclerCloseLid, {
        moduleId,
      })
    )
  }

  if (profileTargetLidTemp !== thermocyclerState.lidTargetTemp) {
    commandCreators.push(
      curryCommandCreator(thermocyclerSetTargetLidTemperature, {
        moduleId,
        celsius: profileTargetLidTemp,
      })
    )
  }

  commandCreators.push(
    curryCommandCreator(thermocyclerRunExtendedProfile, {
      moduleId,
      profileElements,
      blockMaxVolumeUl: profileVolume,
    })
  )

  commandCreators.push(
    curryCommandCreator(thermocyclerStateStep, {
      commandCreatorFnName: 'thermocyclerState',
      moduleId,
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
