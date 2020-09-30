// @flow
import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { CommandCreator } from '../../types'

export const thermocyclerDeactivateLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/deactivateLid',
        params: {
          module: args.module,
        },
      },
    ],
  }
}
