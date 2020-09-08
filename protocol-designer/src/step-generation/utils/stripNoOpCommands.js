// @flow
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
): Array<Command> => {
  const result: Array<Command> = []
  commands.forEach((command, index) => {
    // aspirate followed by dispense
    if (command.command === 'aspirate') {
      const nextCommand: ?Command = commands[index + 1]
      if (
        nextCommand?.command === 'dispense' &&
        _isEqualMix(command.params, nextCommand.params)
      ) {
        return
      }
    }
    // dispense preceded by aspirate
    if (command.command === 'dispense' && index > 0) {
      const prevCommand: ?Command = commands[index - 1]
      if (
        prevCommand?.command === 'aspirate' &&
        _isEqualMix(command.params, prevCommand.params)
      ) {
        return
      }
    }
    result.push(command)
  })
  return result
}

// This is an optimization to avoid unneeded computation during timeline generation.
// Remove groups of commands from the array if together they will have no effect on the state
export const stripNoOpCommands = (commands: Array<Command>): Array<Command> =>
  _stripNoOpMixCommands(commands)
