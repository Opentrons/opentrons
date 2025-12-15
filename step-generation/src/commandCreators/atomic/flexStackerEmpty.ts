import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { uuid } from '../../utils'

import type { FlexStackerEmptyCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const flexStackerEmpty: CommandCreator<
  FlexStackerEmptyCreateCommand['params']
> = (args, invariantContext, prevRobotState) => {
  const { gripperEntities, moduleEntities } = invariantContext
  const flexStackerState = flexStackerStateGetter(prevRobotState, args.moduleId)
  const hasGripperEntity = Object.keys(gripperEntities).length > 0

  const errors: CommandCreatorError[] = []
  if (args.moduleId == null || flexStackerState == null) {
    errors.push(errorCreators.missingModuleError())
  }

  if (!hasGripperEntity) {
    errors.push(errorCreators.flexStackerNoGripper())
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
    python: `${pythonName}.empty()`,
  }
}
