import * as errorCreators from '../../errorCreators'
import { absorbanceReaderStateGetter } from '../../robotStateSelectors'
import { formatPyStr, resolveStringRuntimeValue, uuid } from '../../utils'

import type {
  AbsorbanceReaderReadStepGenArgs,
  CommandCreator,
  CommandCreatorError,
} from '../../types'

export const absorbanceReaderRead: CommandCreator<
  AbsorbanceReaderReadStepGenArgs
> = (args, invariantContext, prevRobotState) => {
  const { fileName } = args
  const { runtimeParameters } = invariantContext
  const moduleId = resolveStringRuntimeValue(args.moduleId, runtimeParameters)
  const resolvedFileName =
    fileName == null
      ? undefined
      : resolveStringRuntimeValue(fileName, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (moduleId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.moduleId })
    )
  }
  if (fileName != null && resolvedFileName == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: fileName })
    )
  }
  if (moduleId == null || errors.length > 0) {
    return { errors }
  }
  const absorbanceReaderState = absorbanceReaderStateGetter(
    prevRobotState,
    moduleId
  )
  if (absorbanceReaderState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  if (absorbanceReaderState.initialization === null) {
    errors.push(errorCreators.absorbanceReaderLidClosed())
  }

  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  // Keep variable names in Python; command params use resolved defaults.
  const pythonfileName =
    fileName != null
      ? `export_filename=${
          runtimeParameters[fileName] != null ? fileName : formatPyStr(fileName)
        }`
      : ''

  return errors.length > 0
    ? { errors }
    : {
        commands: [
          {
            commandType: 'absorbanceReader/read',
            key: uuid(),
            params: {
              moduleId,
              ...(resolvedFileName != null
                ? { fileName: resolvedFileName }
                : {}),
            },
          },
        ],
        python: `${pythonName}.read(${pythonfileName})`,
      }
}
