import type { TemperatureParams } from '@opentrons/shared-data/protocol/types/schemaV4'
import type { CommandCreator } from '../../types'
// @ts-expect-error TODO: remove this after https://github.com/Opentrons/opentrons/pull/10178 merges
export const thermocyclerAwaitLidTemperature: CommandCreator<TemperatureParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        commandType: 'thermocycler/awaitLidTemperature',
        params: {
          moduleId: args.module,
          temperature: args.temperature,
        },
      },
    ],
  }
}
