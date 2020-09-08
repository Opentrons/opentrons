// @flow
import type { _AspDispAirgapParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type { Command } from '@opentrons/shared-data/protocol/flowTypes/schemaV6'

// TODO IMMEDIATELY: clean up flow types here
type AspOrDisp = {|
  command: 'aspirate' | 'dispense' | 'airGap',
  params: _AspDispAirgapParams,
|}

const _isEqualMix = (a: AspOrDisp, b: AspOrDisp): boolean => {
  const compareParams = ['pipette', 'volume', 'labware', 'well']
  return compareParams.every(param => a.params[param] === b.params[param])
}

export const _stripNoOpMixCommands = (
  commands: Array<Command>
): Array<Command> => {
  const result: Array<Command> = []
  commands.forEach((command, index) => {
    if (command.command === 'aspirate') {
      const nextCommand = commands[index + 1]
      if (
        nextCommand?.command === 'dispense' &&
        _isEqualMix(command, nextCommand)
      ) {
        return
      }
    }
    if (command.command === 'dispense' && index > 0) {
      const prevCommand = commands[index - 1]
      if (
        prevCommand.command === 'aspirate' &&
        _isEqualMix(command, prevCommand)
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
