import assert from 'assert'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, EngageMagnetArgs } from '../../types'

/** Engage magnet of specified magnetic module to given engage height. */
export const engageMagnet: CommandCreator<EngageMagnetArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module: moduleId, engageHeight } = args
  const commandType = 'magneticModule/engageMagnet'

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
        params: {
          moduleId,
          engageHeight,
        },
      },
    ],
  }
}
