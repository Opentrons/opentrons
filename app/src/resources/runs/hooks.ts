import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { chainRunCommands } from './utils'
import type { CreateCommand } from '@opentrons/shared-data'

type CreateCommandMutate = ReturnType<
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
  chainRunCommands: (commands: CreateCommand[]) => Promise<unknown>
  isCommandMutationLoading: boolean
} {
  const { createRunCommand, isLoading } = useCreateRunCommandMutation(runId)
  return {
    chainRunCommands: (commands: CreateCommand[]) =>
      chainRunCommands(commands, createRunCommand),
    isCommandMutationLoading: isLoading,
  }
}
