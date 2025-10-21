import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'

import { getModuleIdFromRobotStateStack } from './misc'

import type { RobotState } from '../types'

export const thermocyclerPipetteCollision = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const moduleId = getModuleIdFromRobotStateStack(
    modules,
    labware[labwareId]?.stack
  )

  const moduleState = moduleId && modules[moduleId].moduleState
  const isTCLidClosed: boolean = Boolean(
    moduleState &&
      moduleState.type === THERMOCYCLER_MODULE_TYPE &&
      moduleState.lidOpen !== true
  )
  return isTCLidClosed
}
