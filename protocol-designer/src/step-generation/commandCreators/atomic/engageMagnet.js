// @flow
import assert from 'assert'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'

import type {
  InvariantContext,
  RobotState,
  EngageMagnetArgs,
} from '../../types'

/** Engage magnet of specified magnetic module to given engage height. */
export const engageMagnet = (
  args: EngageMagnetArgs,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
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
