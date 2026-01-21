import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { formatPyStr, uuid } from '../../utils'

import type { FlexStackerEmptyCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const flexStackerEmpty: CommandCreator<
  FlexStackerEmptyCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleEntities } = invariantContext
  const { moduleId, strategy, message, count } = args
  const flexStackerState = flexStackerStateGetter(prevRobotState, moduleId)
  if (moduleId == null || moduleEntities[moduleId] == null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  const errors: CommandCreatorError[] = []
  if (flexStackerState == null) {
    errors.push(errorCreators.missingModuleError())
  }

  if (errors.length > 0) {
    return { errors }
  }
  const pythonName = moduleEntities[moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'flexStacker/empty',
        key: uuid(),
        params: {
          moduleId,
          strategy: strategy,
          message: message,
          count: count,
        },
      },
    ],
    python: `${pythonName}.empty(${
      args.message ? `message=${formatPyStr(args.message)}` : ''
    })`,
  }
}
