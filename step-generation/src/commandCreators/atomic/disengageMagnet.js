// @flow
import assert from 'assert'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import type { CommandCreator, DisengageMagnetArgs } from '../../types'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet: CommandCreator<DisengageMagnetArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { module } = args
  const command = 'magneticModule/disengageMagnet'

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
        },
      },
    ],
  }
}
