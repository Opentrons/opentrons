import { CreateCommand } from '@opentrons/shared-data'
import { CreateRunCommand } from '../types'

/**
 * Runs an array of commands in sequence by chaining them together.
 * @param {CreateCommand[]} commands - An array of CreateCommand objects to be executed.
 * @param {CreateRunCommand} createRunCommand - Function that creates a command to be run.
 * @param {function} onAllSuccess - Function to be executed when all commands have successfully completed.
 * @returns {void}
 */
export const chainRunCommands = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand,
  onAllSuccess: (response: any) => void = () => {}
): void => {
  if (commands.length < 1) return
  createRunCommand(
    {
      command: commands[0],
      waitUntilComplete: true,
    },
    {
      onSuccess: response => {
        if (commands.slice(1).length < 1) {
          onAllSuccess(response)
        } else {
          chainRunCommands(commands.slice(1), createRunCommand, onAllSuccess)
        }
      },
    }
  )
}
