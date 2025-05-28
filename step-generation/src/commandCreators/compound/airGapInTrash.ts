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

interface AirGapInTrashParams {
  pipetteId: string
  flowRate: number
  volume: number
  trashId: string
}
export const airGapInTrash: CommandCreator<AirGapInTrashParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { pipetteId, trashId, flowRate, volume } = args
  const commandCreators: CurriedCommandCreator[] = [
    curryCommandCreator(moveToAddressableArea, {
      pipetteId,
      fixtureId: trashId,
      offset: ZERO_OFFSET,
    }),
    curryWithoutPython(prepareToAspirate, {
      // PAPI air_gap() includes prepare_to_aspirate() so don't emit Python
      pipetteId,
    }),
    curryCommandCreator(airGapInPlace, {
      pipetteId,
      volume,
      flowRate,
    }),
  ]

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
