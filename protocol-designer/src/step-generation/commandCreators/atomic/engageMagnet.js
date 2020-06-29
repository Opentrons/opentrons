// @flow
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import assert from 'assert'

import * as errorCreators from '../../errorCreators'
import type { CommandCreator, EngageMagnetArgs } from '../../types'

/** Engage magnet of specified magnetic module to given engage height. */
export const engageMagnet: CommandCreator<EngageMagnetArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module, engageHeight } = args
  const command = 'magneticModule/engageMagnet'

  if (module === null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  assert(
    invariantContext.moduleEntities[module]?.type === MAGNETIC_MODULE_TYPE,
    `expected module ${module} to be magdeck, got ${invariantContext.moduleEntities[module]?.type}`
  )

  return {
    commands: [
      {
        command: command,
        params: {
          module,
          engageHeight,
        },
      },
    ],
  }
}
