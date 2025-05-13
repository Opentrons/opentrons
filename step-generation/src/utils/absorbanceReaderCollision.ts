import { ABSORBANCE_READER_TYPE } from '@opentrons/shared-data'

import { getModuleIdFromRobotStateStack } from './misc'

import type { RobotState } from '../types'

export const absorbanceReaderCollision = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareStack = labware[labwareId]?.stack
  const moduleId = getModuleIdFromRobotStateStack(modules, labwareStack)
  const moduleState = moduleId != null ? modules[moduleId].moduleState : null
  const isAbsorbanceReaderLidClosed: boolean = Boolean(
    moduleState &&
      moduleState.type === ABSORBANCE_READER_TYPE &&
      moduleState.lidOpen !== true
  )
  return isAbsorbanceReaderLidClosed
}
