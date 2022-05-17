import type { ThermocyclerSetAndWaitForBlockTemperatureArgs } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerSetAndWaitForBlockTemperature: CommandCreator<ThermocyclerSetAndWaitForBlockTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  if (args.volume !== undefined) {
    console.warn(
      `'volume' param not implemented for thermocycler/setAndWaitForBlockTemperature, should not be set!`
    )
  }

  return {
    commands: [
      {
        commandType: 'thermocycler/setAndWaitForBlockTemperature',
        params: {
          moduleId: args.module,
          celsius: args.temperature,
        },
      },
    ],
  }
}
