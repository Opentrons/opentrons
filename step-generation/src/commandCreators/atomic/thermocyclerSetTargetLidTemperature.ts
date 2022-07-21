import { uuid } from '../../utils'
import type { TemperatureParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
export const thermocyclerSetTargetLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/setTargetLidTemperature',
        key: uuid(),
        params: {
          moduleId: args.module,
          celsius: args.temperature,
        },
      },
    ],
  }
}
