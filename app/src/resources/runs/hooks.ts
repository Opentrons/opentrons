import * as React from 'react'
import {
  useCreateCommandMutation,
  useCreateMaintenanceCommandMutation,
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { chainRunCommandsRecursive } from './utils'
import type { CreateCommand } from '@opentrons/shared-data'

export type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Omit<Parameters<CreateCommandMutate>[0], 'runId'>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export type CreateMaintenaceCommand = ReturnType<
  typeof useCreateMaintenanceCommandMutation
>['createMaintenanceCommand']

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

export function useChainMaintenanceCommands(
  maintenanceRunId: string
): {
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainRunCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation(
    maintenanceRunId
  )
  return {
    chainRunCommands: (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) =>
      chainRunCommandsRecursive(
        commands,
        createMaintenanceCommand,
        continuePastCommandFailure,
        setIsLoading
      ),
    isCommandMutationLoading: isLoading,
  }
}

export function useChainCommandsOnce(): {
  chainCommandsOnce: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<boolean>,
  isLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
  const { createMaintenanceRun } = useCreateMaintenanceRunMutation({})
  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({})
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()
  return {
    chainCommandsOnce: (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) =>
      createMaintenanceRun({})
        .then(createRunResponse => (
          chainRunCommandsRecursive(
            commands,
            (
              variables: Parameters<typeof createMaintenanceCommand>[0],
              options: Parameters<typeof createMaintenanceCommand>[1]
            ) => createMaintenanceCommand({ ...variables, maintenanceRunIdOverride: createRunResponse.data.id }, options),
            continuePastCommandFailure,
            setIsLoading
          ).then(() => {
            deleteMaintenanceRun(createRunResponse.data.id)
            return Promise.resolve(true)
          }).catch(error => {
            return Promise.reject(error)
          })
        )).catch(error => {
          return Promise.reject(error)
        }),
    isLoading,
  }
}

