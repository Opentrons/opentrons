import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { CommandCreator } from '../../types'
export const heaterShakerCloseLatch: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'heaterShakerModule/closeLatch',
        params: {
          moduleId: args.moduleId,
        },
      },
    ],
  }
}
