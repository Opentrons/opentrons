import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { vacuumSetPumpPressure } from '../atomic'
import { vacuumCloseVent } from '../atomic/vacuumCloseVent'

import type {
  CommandCreator,
  VacuumCloseVentSetPumpPressureArgs,
} from '../../types'

export const vacuumCloseVentSetPumpPressure: CommandCreator<
  VacuumCloseVentSetPumpPressureArgs
> = (args, invariantContext, prevRobotState) => {
  return reduceCommandCreators(
    [
      curryCommandCreator(vacuumCloseVent, {
        moduleId: args.moduleId,
        commandCreatorFnName: 'vacuumCloseVent',
      }),
      curryCommandCreator(vacuumSetPumpPressure, {
        ...args,
        commandCreatorFnName: 'vacuumSetPumpPressure',
      }),
    ],
    invariantContext,
    prevRobotState
  )
}
