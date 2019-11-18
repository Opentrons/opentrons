// @flow
import assert from 'assert'
import type { EngageMagnetParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV4'
import type { InvariantContext, RobotState } from '../../types'

/** Engage magnet of specified magnetic module to given engage height. */
export const engageMagnet = (
  args: EngageMagnetParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
) => {
  const { module, engageHeight } = args
  const command = 'magneticModule/engageMagnet'

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
          engageHeight,
        },
      },
    ],
  }
}
