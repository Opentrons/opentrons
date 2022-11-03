import { CreateCommand } from '@opentrons/shared-data'
import { CreateRunCommand } from './hooks'

export const chainRunCommands = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand
): Promise<unknown> => {
  if (commands.length < 1)
    return Promise.reject(new Error('no commands to execute'))
  return createRunCommand({
    command: commands[0],
    waitUntilComplete: true,
  })
    .then(response => {
      if (commands.slice(1).length < 1) {
        return Promise.resolve(response)
      } else {
        return chainRunCommands(commands.slice(1), createRunCommand)
      }
    })
    .catch(error => {
      return Promise.reject(error)
    })
}
