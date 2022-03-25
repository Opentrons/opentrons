import { removePairs } from './removePairs'
import type { AspDispAirgapParams } from '@opentrons/shared-data/protocol/types/schemaV6/command/pipetting'
import type { CreateCommand } from '@opentrons/shared-data'

const _isEqualMix = (
  a: AspDispAirgapParams,
  b: AspDispAirgapParams
): boolean => {
  const compareParams: Array<
    'pipetteId' | 'volume' | 'labwareId' | 'wellName'
  > = ['pipetteId', 'volume', 'labwareId', 'wellName']
  return compareParams.every(param => a[param] === b[param])
}

export const _stripNoOpMixCommands = (
  commands: CreateCommand[]
): CreateCommand[] =>
  removePairs<CreateCommand>(
    commands,
    (a, b) =>
      a.commandType === 'aspirate' &&
      b.commandType === 'dispense' &&
      _isEqualMix(a.params, b.params)
  )
// This is an optimization to avoid unneeded computation during timeline generation.
// Remove groups of commands from the array if together they will have no effect on the state
// (NOTE: the only one here right now is strip mix commands, but we may add
// additional transformations besides mix commands to stripNoOpCommands later on)
export const stripNoOpCommands = (commands: CreateCommand[]): CreateCommand[] =>
  _stripNoOpMixCommands(commands)
