// @flow
import { removePairs } from './removePairs'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV6'

const _isEqualMix = (
  a: AspDispAirgapParams,
  b: AspDispAirgapParams
): boolean => {
  const compareParams = ['pipette', 'volume', 'labware', 'well']
  return compareParams.every(param => a[param] === b[param])
}

export const _stripNoOpMixCommands = (
  commands: Array<Command>
): Array<Command> =>
  removePairs<Command>(
    commands,
    (a, b) =>
      a.command === 'aspirate' &&
      b.command === 'dispense' &&
      _isEqualMix(a.params, b.params)
  )

// This is an optimization to avoid unneeded computation during timeline generation.
// Remove groups of commands from the array if together they will have no effect on the state
// (NOTE: the only one here right now is strip mix commands, but we may add
// additional transformations besides mix commands to stripNoOpCommands later on)
export const stripNoOpCommands = (commands: Array<Command>): Array<Command> =>
  _stripNoOpMixCommands(commands)
