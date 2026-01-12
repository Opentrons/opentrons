import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { formatPyStr, uuid } from '../../utils'

import type { FlexStackerEmptyCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const flexStackerEmpty: CommandCreator<
  FlexStackerEmptyCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { moduleEntities } = invariantContext
  const flexStackerState = flexStackerStateGetter(prevRobotState, args.moduleId)

  const errors: CommandCreatorError[] = []
  if (args.moduleId == null || flexStackerState == null) {
    errors.push(errorCreators.missingModuleError())
  }

  if (errors.length > 0) {
    return { errors }
  }
  const pythonName = moduleEntities[args.moduleId].pythonName

  return {
    commands: [
      {
        commandType: 'flexStacker/empty',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
          strategy: args.strategy,
          message: args.message,
          count: args.count,
        },
      },
    ],
    python: `${pythonName}.empty(${
      args.message ? `message=${formatPyStr(args.message)}` : ''
    })`,
  }
}
