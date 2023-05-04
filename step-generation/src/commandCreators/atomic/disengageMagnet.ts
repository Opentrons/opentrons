import * as errorCreators from '../../errorCreators'
import type { CommandCreator, DisengageMagnetArgs } from '../../types'
import { uuid } from '../../utils'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import assert from 'assert'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet: CommandCreator<DisengageMagnetArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module: moduleId } = args
  const commandType = 'magneticModule/disengage'

  if (module === null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  assert(
    invariantContext.moduleEntities[moduleId]?.type === MAGNETIC_MODULE_TYPE,
    `expected module ${moduleId} to be magdeck, got ${invariantContext.moduleEntities[moduleId]?.type}`
  )
  return {
    commands: [
      {
        commandType,
        key: uuid(),
        params: {
          moduleId,
        },
      },
    ],
  }
}
