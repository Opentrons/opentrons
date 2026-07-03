import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { vacuumCloseVent, vacuumStartRunProfile } from '../atomic'

import type {
  CommandCreator,
  VacuumCloseVentStartProfileArgs,
} from '../../types'

export const vacuumCloseVentStartProfile: CommandCreator<
  VacuumCloseVentStartProfileArgs
> = (args, invariantContext, prevRobotState) => {
  const { ventAfter } = args
  return reduceCommandCreators(
    [
      curryCommandCreator(vacuumCloseVent, {
        moduleId: args.moduleId,
        commandCreatorFnName: 'vacuumCloseVent',
      }),
      curryCommandCreator(vacuumStartRunProfile, {
        ...args,
        commandCreatorFnName: 'vacuumStartRunProfile',
        ventAfter,
      }),
    ],
    invariantContext,
    prevRobotState
  )
}
