import * as React from 'react'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { chainRunCommandsRecursive } from './utils'
import type { CreateCommand } from '@opentrons/shared-data'

export type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Omit<Parameters<CreateCommandMutate>[0], 'runId'>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

type CreateRunCommandMutation = Omit<
  ReturnType<typeof useCreateCommandMutation>,
  'createCommand'
> & { createRunCommand: CreateRunCommand }

export function useCreateRunCommandMutation(
  runId: string
): CreateRunCommandMutation {
  const createCommandMutation = useCreateCommandMutation()
  return {
    ...createCommandMutation,
    createRunCommand: (variables, ...options) =>
      createCommandMutation.createCommand({ ...variables, runId }, ...options),
  }
}

export function useChainRunCommands(
  runId: string
): {
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainRunCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
  const { createRunCommand } = useCreateRunCommandMutation(runId)
  return {
    chainRunCommands: (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) =>
      chainRunCommandsRecursive(
        commands,
        createRunCommand,
        continuePastCommandFailure,
        setIsLoading
      ),
    isCommandMutationLoading: isLoading,
  }
}
