import { uuid } from '../../utils'

import type { CommandCreator } from '../../types'
import type { ModuleOnlyParams } from '@opentrons/shared-data'

export const thermocyclerDeactivateBlock: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const pythonName = invariantContext.moduleEntities[args.moduleId].pythonName
  return {
    commands: [
      {
        commandType: 'thermocycler/deactivateBlock',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
    python: `${pythonName}.deactivate_block()`,
  }
}
