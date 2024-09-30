import { useState } from 'react'
import { useSelector } from 'react-redux'

import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
  useCreateMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import {
  chainLiveCommandsRecursive,
  chainRunCommandsRecursive,
  setCommandIntent,
} from './utils'
import { getIsOnDevice } from '/app/redux/config'
// TODO: refactor this so helper code doesn't spawn UI
/* eslint-disable-next-line opentrons/no-imports-across-applications */
import { useMaintenanceRunTakeover } from '/app/organisms/TakeoverModal'

import type { CreateCommand } from '@opentrons/shared-data'
import type { HostConfig } from '@opentrons/api-client'
import type {
  CreateMaintenanceRunType,
  UseCreateMaintenanceRunMutationOptions,
  UseCreateMaintenanceRunMutationResult,
  useCreateMaintenanceCommandMutation,
} from '@opentrons/react-api-client'

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
  runId: string,
  failedCommandId?: string
): CreateRunCommandMutation {
  const createCommandMutation = useCreateCommandMutation()

  return {
    ...createCommandMutation,
    createRunCommand: (variables, ...options) => {
      const { command } = variables
      const commandWithIntent = setCommandIntent(command, failedCommandId)

      return createCommandMutation.createCommand(
        { ...variables, runId, command: commandWithIntent, failedCommandId },
        ...options
      )
    },
  }
}

export function useChainRunCommands(
  runId: string,
  failedCommandId?: string
): {
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainRunCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)

  const { createRunCommand } = useCreateRunCommandMutation(
    runId,
    failedCommandId
  )
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

export function useChainLiveCommands(): {
  chainLiveCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainLiveCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  return {
    chainLiveCommands: (
      commands: CreateCommand[],
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

// A wrapper around useCreateMaintenanceRunMutation that ensures the ODD TakeoverModal renders, if applicable.
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
