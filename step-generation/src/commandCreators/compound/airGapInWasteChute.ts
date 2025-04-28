import { ZERO_OFFSET } from '../../constants'
import type { CommandCreator, CurriedCommandCreator } from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import {
  airGapInPlace,
  moveToAddressableArea,
  prepareToAspirate,
} from '../atomic'

interface AirGapInWasteChuteArgs {
  pipetteId: string
  volume: number
  flowRate: number
  wasteChuteId: string
}

export const airGapInWasteChute: CommandCreator<AirGapInWasteChuteArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, volume, flowRate, wasteChuteId } = args

  const commandCreators: CurriedCommandCreator[] = [
    curryCommandCreator(moveToAddressableArea, {
      pipetteId,
      fixtureId: wasteChuteId,
      offset: ZERO_OFFSET,
    }),
    curryCommandCreator(prepareToAspirate, {
      pipetteId,
    }),
    curryCommandCreator(airGapInPlace, {
      pipetteId,
      flowRate,
      volume,
    }),
  ]

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
