import { uuid } from '../../utils'
import type { CommandCreator } from '../../types'
export interface AspirateInPlaceArgs {
  pipetteId: string
  volume: number
  flowRate: number
}

export const aspirateInPlace: CommandCreator<AspirateInPlaceArgs> = (
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
