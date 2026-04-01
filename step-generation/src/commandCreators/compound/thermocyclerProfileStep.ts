import * as errorCreators from '../../errorCreators'
import { thermocyclerStateGetter } from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { thermocyclerCloseLid } from '../atomic/thermocyclerCloseLid'
import { thermocyclerSetTargetLidTemperature } from '../atomic/thermocyclerSetTargetLidTemperature'
import { thermocyclerStartRunExtendedProfile } from '../atomic/thermocyclerStartRunExtendedProfile'

import type {
  CommandCreator,
  CurriedCommandCreator,
  ThermocyclerProfileStepArgs,
} from '../../types'

export const thermocyclerProfileStep: CommandCreator<
  ThermocyclerProfileStepArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, profileElements, profileTargetLidTemp, profileVolume } =
    args
  const thermocyclerState = thermocyclerStateGetter(prevRobotState, moduleId)
  if (thermocyclerState === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const thermocyclerPythonName =
    invariantContext.moduleEntities[moduleId].pythonName

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

  // This is going to get used as a Python variable name, so it's snake_case.
  const taskId = `${thermocyclerPythonName}_task_${thermocyclerState.numProfilesStarted + 1}`
  commandCreators.push(
    curryCommandCreator(thermocyclerStartRunExtendedProfile, {
      moduleId,
      profileElements,
      blockMaxVolumeUl: profileVolume,
      taskId,
    })
  )

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
