import * as errorCreators from '../../errorCreators'
import { flexStackerStateGetter } from '../../robotStateSelectors'
import { formatPyStr, spaceInHopper, uuid } from '../../utils'

import type { FlexStackerFillCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerFill: CommandCreator<
  FlexStackerFillCreateCommand['params']
> = (args, invariantContext, robotState) => {
  const { moduleId, message, count, labwareToStore } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
  const flexStackerState = flexStackerStateGetter(robotState, moduleId)
  const isSpace = spaceInHopper(flexStackerState)

  const pythonArgs = [
    ...(count != null ? [`count=${count}`] : []),
    ...(message != null ? [`message=${formatPyStr(message)}`] : []),
  ]
  // TODO: add mismatched labware error ?

  if (!isSpace) {
    return {
      errors: [errorCreators.flexStackerHopperFull()],
    }
  }
  return {
    commands: [
      {
        commandType: 'flexStacker/fill',
        key: uuid(),
        params: {
          moduleId,
          strategy: 'manualWithPause',
          message,
          count,
          labwareToStore,
        },
      },
    ],
    python: `${pythonName}.fill(${pythonArgs.join(', ')})`,
  }
}
