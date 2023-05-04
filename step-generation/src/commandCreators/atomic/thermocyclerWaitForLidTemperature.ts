import type { CommandCreator } from '../../types'
import { uuid } from '../../utils'
import type { ModuleOnlyParams } from '@opentrons/shared-data/protocol/types/schemaV4'

export const thermocyclerWaitForLidTemperature: CommandCreator<ModuleOnlyParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/waitForLidTemperature',
        key: uuid(),
        params: {
          moduleId: args.module,
        },
      },
    ],
  }
}
