import * as errorCreators from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import { resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  CommandCreator,
  CommandCreatorError,
  ModuleStepGenArgs,
} from '../../types'

export const absorbanceReaderCloseLid: CommandCreator<ModuleStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { gripperEntities, moduleEntities, runtimeParameters } =
    invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  if (moduleId == null) {
    return {
      errors: [
        errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId }),
      ],
    }
  }
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    moduleId
  )
  const hasGripperEntity = Object.keys(gripperEntities).length > 0
  const errors: CommandCreatorError[] = []
  if (absorbanceReaderState == null) {
    errors.push(errorCreators.missingModuleError())
  }
  if (!hasGripperEntity) {
    errors.push(errorCreators.absorbanceReaderNoGripper())
  }
  if (errors.length > 0) {
    return { errors }
  }
  const pythonName = moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'absorbanceReader/closeLid',
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
    python: `${pythonName}.close_lid()`,
  }
}
