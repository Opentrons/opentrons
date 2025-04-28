import { uuid } from '../../utils'

import type { AspirateInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const aspirateInPlace: CommandCreator<AspirateInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate } = args

  const commands = [
    {
      commandType: 'aspirateInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
      },
    },
  ]
  return {
    commands,
  }
}
