import { ZERO_OFFSET } from '../../constants'
import type { CommandCreator, CurriedCommandCreator } from '../../types'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import {
  airGapInPlace,
  moveToAddressableArea,
  prepareToAspirate,
} from '../atomic'

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
    curryCommandCreator(prepareToAspirate, {
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
