import { ZERO_OFFSET } from '../../constants'
import {
  curryCommandCreator,
  curryWithoutPython,
  reduceCommandCreators,
} from '../../utils'
import {
  airGapInPlace,
  moveToAddressableArea,
  prepareToAspirate,
} from '../atomic'

import type { CommandCreator, CurriedCommandCreator } from '../../types'

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
    curryWithoutPython(prepareToAspirate, {
      // PAPI air_gap() includes prepare_to_aspirate() so don't emit Python
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
