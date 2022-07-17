import { uuid } from '../../utils'
import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerDeactivateLid: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/deactivateLid',
        key: uuid(),
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
