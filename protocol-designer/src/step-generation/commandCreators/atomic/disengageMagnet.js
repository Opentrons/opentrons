// @flow
import assert from 'assert'
import * as errorCreators from '../../errorCreators'
import type {
  InvariantContext,
  RobotState,
  DisengageMagnetArgs,
} from '../../types'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet = (
  args: DisengageMagnetArgs,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  const { module } = args
  const command = 'magneticModule/disengageMagnet'

  if (module === null) {
    return { errors: [errorCreators.missingModuleError()] }
  }

  assert(
    invariantContext.moduleEntities[module]?.type === 'magdeck',
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
