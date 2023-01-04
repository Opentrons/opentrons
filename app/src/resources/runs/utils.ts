import * as React from 'react'
import { CreateCommand } from '@opentrons/shared-data'
import { CreateRunCommand } from './hooks'

export const chainRunCommands = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand,
  continuePastCommandFailure: boolean = true,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<unknown> => {
  if (commands.length < 1)
    return Promise.reject(new Error('no commands to execute'))
  setIsLoading(true)
  return createRunCommand({
    command: commands[0],
    waitUntilComplete: true,
  })
    .then(response => {
      if (!continuePastCommandFailure && response.data.status === 'failed') {
        setIsLoading(false)
        return Promise.reject(
          new Error(response.data.error?.detail ?? 'command failed')
        )
      }
      if (commands.slice(1).length < 1) {
        setIsLoading(false)
        return Promise.resolve(response)
      } else {
        return chainRunCommands(
          commands.slice(1),
          createRunCommand,
          continuePastCommandFailure,
          setIsLoading
        )
      }
    })
    .catch(error => {
      setIsLoading(false)
      return Promise.reject(error)
    })
}
