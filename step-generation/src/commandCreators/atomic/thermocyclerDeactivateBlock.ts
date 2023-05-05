import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'

import type { CommandCreator } from '../../types'
import { uuid } from '../../utils'

export const thermocyclerDeactivateBlock: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/deactivateBlock',
        key: uuid(),
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
