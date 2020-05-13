// @flow
import type { CommandCreator, ThermocyclerStateStepArgs } from '../../types'
import { thermocyclerSetTargetBlockTemperature } from '../atomic/thermocyclerSetTargetBlockTemperature'
import { thermocyclerDeactivateBlock } from '../atomic/thermocyclerDeactivateBlock'
export const thermocyclerStateStep: CommandCreator<ThermocyclerStateStepArgs> = () => {
  const diff = getTCStateDiff(prevRobotState, args) // {lid: OPEN, blockTemperature: ACTIVATE, lidTemperature: DEACTIVATE}

  //iterate through map in specific order: open/close => block => lid

  if (diff.lid) {
    if (diff.lid === 'OPEN') {
      thermocyclerOpenLid()
    } else if (diff.lid === 'CLOSE') {
      thermocyclerCloseLid()
    } else {
      console.warn('something went wrong')
    }
  }

  if (diff.blockTemperature) {
    if (diff.blockTemperature === 'ACTIVATE') {
      thermocyclerSetTargetBlockTemperature(args.thermocyclerBlockTemperature)
    } else if (diff.blockTemperature === 'DEACTIVATE') {
      thermocyclerDeactivateBlock(args.thermocyclerBlockTemperature)
    }
  }
}
