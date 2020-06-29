// @flow
import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

import type { CommandCreator } from '../../types'

export const thermocyclerCloseLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/closeLid',
        params: {
          module: args.module,
        },
      },
    ],
  }
}
