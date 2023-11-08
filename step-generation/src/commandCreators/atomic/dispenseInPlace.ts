import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
export interface DispenseInPlaceArgs {
  pipetteId: string
  volume: number
  flowRate: number
}

export const dispenseInPlace: CommandCreator<DispenseInPlaceArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate } = args

  const commands = [
    {
      commandType: 'dispenseInPlace' as const,
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
