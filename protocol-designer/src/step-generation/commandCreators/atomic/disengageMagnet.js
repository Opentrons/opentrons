// @flow
import assert from 'assert'
import type { DisengageMagnetParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { InvariantContext, RobotState } from '../../types'

/** Disengage magnet of specified magnetic module. */
export const disengageMagnet = (
  args: DisengageMagnetParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  const { module } = args
  const command = 'magneticModule/disengageMagnet'

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
