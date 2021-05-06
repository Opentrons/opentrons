import type { TemperatureParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerAwaitBlockTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/awaitBlockTemperature',
        params: {
          module: args.module,
          temperature: args.temperature,
        },
      },
    ],
  }
}
