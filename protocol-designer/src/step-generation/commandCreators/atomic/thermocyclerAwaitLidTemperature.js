// @flow
import type { TemperatureParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { CommandCreator } from '../../types'

export const thermocyclerAwaitLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/awaitLidTemperature',
        params: {
          module: args.module,
          temperature: args.temperature,
        },
      },
    ],
  }
}
