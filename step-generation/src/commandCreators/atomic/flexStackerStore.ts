import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import {
  getIsSpaceInHopper,
  getLabwareIdOnShuttle,
  labwareMatchesLabwareInHopper,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { CommandCreator, ModuleStepGenArgs } from '../../types'

export const flexStackerStore: CommandCreator<ModuleStepGenArgs> = (
  args,
  invariantContext,
  robotState
) => {
  const { labwareEntities, moduleEntities, runtimeParameters } =
    invariantContext
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
  const pythonName = moduleEntities[moduleId].pythonName
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const labwareId = flexStackerState?.labwareOnShuttle?.primaryLabwareId ?? null
  const isSpace = getIsSpaceInHopper(flexStackerState, labwareEntities)
  if (flexStackerState !== null && !getLabwareIdOnShuttle(flexStackerState)) {
    return {
      errors: [errorCreators.flexStackerShuttleEmpty()],
    }
  }

  if (
    labwareId !== null &&
    !labwareMatchesLabwareInHopper(
      labwareId,
      invariantContext,
      flexStackerState
    )
  ) {
    return {
      errors: [errorCreators.flexStackerLabwareTypeMismatch()],
    }
  }
  if (!isSpace) {
    return {
      errors: [errorCreators.flexStackerHopperFull()],
    }
  }
  return {
    commands: [
      {
        commandType: 'flexStacker/store',
        key: uuid(),
        params: {
          moduleId,
          strategy: 'automatic', // hardcoding here, since 'manual' should only be used in error recovery
        },
      },
    ],
    python: `${pythonName}.store()`,
  }
}
