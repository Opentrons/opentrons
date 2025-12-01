import { uuid } from '../../utils'

import type { FlexStackerStoreCreateCommand } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const flexStackerStore: CommandCreator<
  FlexStackerStoreCreateCommand['params']
> = (args, invariantContext) => {
  const { moduleId } = args
  const pythonName = invariantContext.moduleEntities[moduleId].pythonName
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
