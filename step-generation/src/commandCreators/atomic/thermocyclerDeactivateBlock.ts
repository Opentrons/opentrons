import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerDeactivateBlock: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/deactivateBlock',
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
