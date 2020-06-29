// @flow
import type { TemperatureParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'

import type { CommandCreator } from '../../types'

export const thermocyclerSetTargetLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'thermocycler/setTargetLidTemperature',
        params: {
          module: args.module,
          temperature: args.temperature,
        },
      },
    ],
  }
}
