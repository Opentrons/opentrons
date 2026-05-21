import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { vacuumCloseVent } from '../atomic/vacuumCloseVent'
import { vacuumSetPumpPower } from '../atomic/vacuumSetPumpPower'

import type {
  CommandCreator,
  VacuumCloseVentSetPumpPowerArgs,
} from '../../types'

export const vacuumCloseVentSetPumpPower: CommandCreator<
  VacuumCloseVentSetPumpPowerArgs
> = (args, invariantContext, prevRobotState) => {
  return reduceCommandCreators(
    [
      curryCommandCreator(vacuumCloseVent, {
        moduleId: args.moduleId,
        commandCreatorFnName: 'vacuumCloseVent',
      }),
      curryCommandCreator(vacuumSetPumpPower, {
        ...args,
        commandCreatorFnName: 'vacuumSetPumpPower',
      }),
    ],
    invariantContext,
    prevRobotState
  )
}
