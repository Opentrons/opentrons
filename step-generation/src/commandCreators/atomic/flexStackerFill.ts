import { formatPyStr, uuid } from '../../utils'

import type { FlexStackerFillCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerFill: CommandCreator<
  FlexStackerFillCreateCommand['params']
> = (args, invariantContext) => {
  const { moduleId, message, count, labwareToStore } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName

  // TODO: add error creators

  const pythonArgs = [
    ...(count != null ? [`count=${count}`] : []),
    ...(message != null ? [`message=${formatPyStr(message)}`] : []),
  ]

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
