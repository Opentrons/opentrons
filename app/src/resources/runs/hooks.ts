import * as React from 'react'
import { useSelector } from 'react-redux'
import type { CreateCommand } from '@opentrons/shared-data'
import type { HostConfig } from '@opentrons/api-client'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
  useCreateMaintenanceCommandMutation,
  useCreateMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import {
  chainRunCommandsRecursive,
  chainMaintenanceCommandsRecursive,
  chainLiveCommandsRecursive,
} from './utils'
import { getIsOnDevice } from '../../redux/config'
import { useMaintenanceRunTakeover } from '../../organisms/TakeoverModal'
import type {
  UseCreateMaintenanceRunMutationOptions,
  UseCreateMaintenanceRunMutationResult,
  CreateMaintenanceRunType,
} from '@opentrons/react-api-client'
import type { ModulePrepCommandsType } from '../../organisms/Devices/getModulePrepCommands'

export type CreateCommandMutate = ReturnType<
  typeof useCreateCommandMutation
>['createCommand']
export type CreateRunCommand = (
  params: Omit<Parameters<CreateCommandMutate>[0], 'runId'>,
  options?: Parameters<CreateCommandMutate>[1]
) => ReturnType<CreateCommandMutate>

export type CreateMaintenanceCommand = ReturnType<
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

export function useChainMaintenanceCommands(): {
  chainRunCommands: (
    maintenanceRunId: string,
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainMaintenanceCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
  const { createMaintenanceCommand } = useCreateMaintenanceCommandMutation()
  return {
    chainRunCommands: (
      maintenanceRunId,
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) =>
      chainMaintenanceCommandsRecursive(
        maintenanceRunId,
        commands,
        createMaintenanceCommand,
        continuePastCommandFailure,
        setIsLoading
      ),
    isCommandMutationLoading: isLoading,
  }
}

export function useChainLiveCommands(): {
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainLiveCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = React.useState(false)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  return {
    chainLiveCommands: (
      commands: ModulePrepCommandsType[],
      continuePastCommandFailure: boolean
    ) =>
      chainLiveCommandsRecursive(
        commands,
        createLiveCommand,
        continuePastCommandFailure,
        setIsLoading
      ),
    isCommandMutationLoading: isLoading,
  }
}

type CreateTargetedMaintenanceRunMutation = UseCreateMaintenanceRunMutationResult & {
  createTargetedMaintenanceRun: CreateMaintenanceRunType
}

export function useCreateTargetedMaintenanceRunMutation(
  options: UseCreateMaintenanceRunMutationOptions = {},
  hostOverride?: HostConfig | null
): CreateTargetedMaintenanceRunMutation {
  const createMaintenanceRunMutation = useCreateMaintenanceRunMutation(
    options,
    hostOverride
  )
  const isOnDevice = useSelector(getIsOnDevice)
  const { setOddRunIds } = useMaintenanceRunTakeover()

  return {
    ...createMaintenanceRunMutation,
    createTargetedMaintenanceRun: (variables, ...options) =>
      createMaintenanceRunMutation
        .createMaintenanceRun(variables, ...options)
        .then(res => {
          if (isOnDevice)
            setOddRunIds({ currentRunId: res.data.id, oddRunId: res.data.id })
          return Promise.resolve(res)
        })
        .catch(error => error),
  }
}
