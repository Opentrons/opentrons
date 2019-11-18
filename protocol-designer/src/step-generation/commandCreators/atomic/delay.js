// @flow
import type { DelayParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { NextCommandCreator } from '../../types'

const delay: NextCommandCreator<DelayParams> = (
  args,
  invariantContext,
  prevRobotState
) => {
  return {
    commands: [
      {
        command: 'delay',
        params: {
          message: args.message,
          wait: args.wait,
        },
      },
    ],
  }
}

export default delay
