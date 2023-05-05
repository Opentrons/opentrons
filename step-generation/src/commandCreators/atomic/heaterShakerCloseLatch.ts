import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

import type { CommandCreator } from '../../types'
import { uuid } from '../../utils'

export const heaterShakerCloseLatch: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'heaterShaker/closeLabwareLatch',
        key: uuid(),
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}
