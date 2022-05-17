import type { TemperatureParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerWaitForBlockTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/waitForBlockTemperature',
        params: {
          moduleId: args.module,
          celsius: args.temperature,
        },
      },
    ],
  }
}
