// @flow
import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

import type { CommandCreator } from '../../types'

export const thermocyclerDeactivateBlock: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/deactivateBlock',
        params: {
          module: args.module,
        },
      },
    ],
  }
}
