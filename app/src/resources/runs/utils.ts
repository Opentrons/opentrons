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
      console.log(response)
      // we may want to exit early here and reject the promise if the command status is failed
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
