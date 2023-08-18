import * as React from 'react'
import type { CommandData } from '@opentrons/api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { CreateMaintenaceCommand, CreateRunCommand } from './hooks'

export const chainRunCommandsRecursive = (
  commands: CreateCommand[],
  createRunCommand: CreateRunCommand | CreateMaintenaceCommand,
  continuePastCommandFailure: boolean = true,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<CommandData[]> => {
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
        return Promise.resolve([response])
      } else {
        return chainRunCommandsRecursive(
          commands.slice(1),
          createRunCommand,
          continuePastCommandFailure,
          setIsLoading
        ).then(deeperResponses => {
          return [response, ...deeperResponses]
        })
      }
    })
    .catch(error => {
      setIsLoading(false)
      return Promise.reject(error)
    })
}
