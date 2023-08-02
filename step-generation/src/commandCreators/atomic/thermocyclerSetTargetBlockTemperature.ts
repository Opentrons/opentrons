import { uuid } from '../../utils'
import type { ThermocyclerSetBlockTemperatureArgs } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerSetTargetBlockTemperature: CommandCreator<ThermocyclerSetBlockTemperatureArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  if (args.volume !== undefined) {
    console.warn(
      `'volume' param not implemented for thermocycler/setTargetBlockTemperature, should not be set!`
    )
  }

  return {
    commands: [
      {
        commandType: 'thermocycler/setTargetBlockTemperature',
        key: uuid(),
        params: {
          moduleId: args.module,
          celsius: args.temperature,
          //  TODO( jr 7/17/23): add optional blockMaxVolumeUI and holdTimeSeconds params
        },
      },
    ],
  }
}
