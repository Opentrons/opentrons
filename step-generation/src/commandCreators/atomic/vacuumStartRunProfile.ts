import * as errorCreators from '../../errorCreators'
import { vacuumModuleStateGetter } from '../../robotStateSelectors'
import {
  formatPyValue,
  getModuleHasLiveTask,
  indentPyLines,
  uuid,
} from '../../utils'
import { getVacuumProfileStepString } from '../../utils/vacuumPythonArgs/getVacuumProfileStepString'

import type { VacuumModuleStartRunProfileCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, VacuumStartRunProfileArgs } from '../../types'

// TODO: (nd, 2026-04-20) command creator implementation
export const vacuumStartRunProfile: CommandCreator<
  VacuumStartRunProfileArgs
> = (args, invariantContext, prevRobotState) => {
  const { moduleId, profile, ventAfter } = args

  // TODO: (nd, 2026-04-23) implement Python
  const vacuumState = vacuumModuleStateGetter(prevRobotState, moduleId)
  if (vacuumState === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const hasLiveTask = getModuleHasLiveTask(vacuumState)
  if (hasLiveTask) {
    return {
      errors: [errorCreators.liveTaskError()],
    }
  }

  const vacuumPythonName = invariantContext.moduleEntities[moduleId].pythonName

  // 1-indexed profile task ID
  const taskId = `${vacuumPythonName}_task_${vacuumState.numPumpActivitiesStarted + 1}`
  const profilePythonArgs = getVacuumProfileStepString(profile)
  const ventAfterPythonArg = `vent_after=${formatPyValue(ventAfter)}`

  // explicitly attach the ventAfter param to the final step of the profile in accordance with PE command shape
  // there is no direct ventAfter param at the startRunProfile command params top level
  const profileWithVentOnFinal: VacuumModuleStartRunProfileCreateCommand['params']['steps'] =
    profile.map((step, index) => {
      if (index === profile.length - 1) {
        return { ...step, ventAfter }
      }
      return step
    })

  const python = `${taskId} = ${vacuumPythonName}.start_execute_profile(\n${indentPyLines([...profilePythonArgs, ventAfterPythonArg].join(',\n'))}\n)`

  return {
    commands: [
      {
        commandType: 'vacuumModule/startRunProfile',
        key: uuid(),
        params: {
          moduleId,
          steps: profileWithVentOnFinal,
          ventAfter,
          taskId,
        },
      },
    ],
    python,
  }
}
