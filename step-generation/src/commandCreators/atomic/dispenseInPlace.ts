import type { DispenseInPlaceParams } from '@opentrons/shared-data'
import type { CommandCreator } from '../../types'
import { uuid } from '../../utils'

export const dispenseInPlace: CommandCreator<DispenseInPlaceParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, pushOut } = args

  const commands = [
    {
      commandType: 'dispenseInPlace' as const,
      key: uuid(),
      params: {
        pipetteId,
        volume,
        flowRate,
        ...(pushOut != null ? { pushOut } : {}),
      },
    },
  ]
  return {
    commands,
  }
}
