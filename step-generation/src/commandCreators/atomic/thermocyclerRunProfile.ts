import { uuid } from '../../utils'
import type { TCProfileParams } from '@opentrons/shared-data/protocol/types/schemaV4'
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
        commandType: 'thermocycler/runProfile',
        key: uuid(),
        params: {
          moduleId: module,
          profile: profile.map(profileItem => ({
            holdSeconds: profileItem.holdTime,
            celsius: profileItem.temperature,
          })),
          blockMaxVolumeUl: volume,
        },
      },
    ],
  }
}
