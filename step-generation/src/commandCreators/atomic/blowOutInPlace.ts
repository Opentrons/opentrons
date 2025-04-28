import type { BlowoutInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
import { uuid } from '../../utils'

export const blowOutInPlace: CommandCreator<BlowoutInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, flowRate } = args
  const commands = [
    {
      commandType: 'blowOutInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        flowRate,
      },
    },
  ]
  return {
    commands,
  }
}
