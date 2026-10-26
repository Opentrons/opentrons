import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  getLabwareIdOnShuttle,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CommandCreator, ModuleStepGenArgs } from '../../types'

export const flexStackerRetrieve: CommandCreator<ModuleStepGenArgs> = (
  args,
  invariantContext,
  robotState
) => {
  const { moduleEntities, runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  if (moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId }),
      ],
    }
  }
  if (moduleEntities[moduleId] == null) {
    return { errors: [errorCreators.missingModuleError()] }
  }
  const modulePythonName = moduleEntities[moduleId].pythonName
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isLabwareInHopper =
    flexStackerState?.labwareInHopper != null &&
    flexStackerState.labwareInHopper.length > 0

  if (flexStackerState !== null && getLabwareIdOnShuttle(flexStackerState)) {
    return {
      errors: [errorCreators.flexStackerShuttleFull()],
    }
  }
  if (!isLabwareInHopper) {
    return {
      errors: [errorCreators.flexStackerHopperEmpty()],
    }
  }
  return {
    commands: [
      {
        commandType: 'flexStacker/retrieve',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${modulePythonName}.retrieve()`,
  }
}
