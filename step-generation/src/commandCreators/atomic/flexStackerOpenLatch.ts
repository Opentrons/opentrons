import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { uuid } from '../../utils'

import type { UnsafeFlexStackerOpenLatchCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

export const flexStackerOpenLatch: CommandCreator<
  UnsafeFlexStackerOpenLatchCreateCommand['params']
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
        commandType: 'flexStacker/openLatch',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
    python: `${pythonName}.open_latch()`,
  }
}
