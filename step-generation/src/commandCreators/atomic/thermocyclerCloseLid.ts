import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerCloseLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/closeLid',
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
