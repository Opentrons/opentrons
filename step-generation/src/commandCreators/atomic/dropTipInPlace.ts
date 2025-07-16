import { uuid } from '../../utils'

import type { DropTipInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'

export const dropTipInPlace: CommandCreator<DropTipInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId } = args
  // No-op if there is no tip
  if (!prevRobotState.tipState.pipettes[pipetteId]?.hasTip) {
    return {
      commands: [],
    }
  }

  const commands = [
    {
      commandType: 'dropTipInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
      },
    },
  ]
  return {
    commands,
  }
}
