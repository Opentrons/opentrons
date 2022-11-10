import { CreateCommand } from '@opentrons/shared-data'
import { CreateRunCommand } from './hooks'

export const chainRunCommands = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand,
  continuePastCommandFailure: boolean = true
): Promise<unknown> => {
  if (commands.length < 1)
    return Promise.reject(new Error('no commands to execute'))
  return createRunCommand({
    command: commands[0],
    waitUntilComplete: true,
  })
    .then(response => {
      console.log(response)
      if (!continuePastCommandFailure && response.data.status === 'failed') {
        return Promise.reject(
          new Error(response.data.error?.detail ?? 'command failed')
        )
      }
      if (commands.slice(1).length < 1) {
        return Promise.resolve(response)
      } else {
        return chainRunCommands(
          commands.slice(1),
          createRunCommand,
          continuePastCommandFailure
        )
      }
    })
    .catch(error => {
      return Promise.reject(error)
    })
}
