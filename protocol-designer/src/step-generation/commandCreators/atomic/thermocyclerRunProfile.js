// @flow
import type { TCProfileParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { CommandCreator } from '../../types'

export const thermocyclerRunProfile: CommandCreator<TCProfileParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, profile, volume } = args
  return {
    commands: [
      {
        command: 'thermocycler/runProfile',
        params: {
          module,
          profile,
          volume,
        },
      },
    ],
  }
}
