import { useState } from 'react'
import { useSelector } from 'react-redux'

import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
  useCreateMaintenanceRunMutation,
} from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
// TODO: refactor this so helper code doesn't spawn UI
/* eslint-disable-next-line opentrons/no-imports-across-applications */
import { useMaintenanceRunTakeover } from '/app/organisms/TakeoverModal'
import { getIsOnDevice } from '/app/redux/config'

import {
  chainLiveCommandsRecursive,
  chainRunCommandsRecursive,
  setCommandIntent,
} from './utils'

import type { ErrorRecoveryPolicy, HostConfig } from '@opentrons/api-client'
import type {
  CreateMaintenanceRunType,
  DocumentationState,
  DocumentedAction,
  useCreateMaintenanceCommandMutation,
  UseCreateMaintenanceRunMutationOptions,
  UseCreateMaintenanceRunMutationResult,
} from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'

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
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  addActionToDocument: (action: DocumentedAction) => void,
  failedCommandId?: string
): CreateRunCommandMutation {
  const createCommandMutation = useCreateCommandMutation(
    documentationState,
    actionsToDocument,
    addActionToDocument
  )

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
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  addActionToDocument: (action: DocumentedAction) => void,
  failedCommandId?: string,
  recoveryPolicy?: ErrorRecoveryPolicy
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
    documentationState,
    actionsToDocument,
    addActionToDocument,
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
        setIsLoading,
        recoveryPolicy
      ),
    isCommandMutationLoading: isLoading,
  }
}

// NOTE (jj 9/4/26): This hook is used in exactly two places to do the same two stacker commands.
// If you want to use this to send different sets of commands with the same hook call, this will need updating.
export function useChainLiveCommands(
  actionsToDocument: DocumentedAction[],
  resetKey: string
): {
  chainLiveCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => ReturnType<typeof chainLiveCommandsRecursive>
  isCommandMutationLoading: boolean
} {
  const [isLoading, setIsLoading] = useState(false)
  const { documentationState } = useLinkedDocumentationState(
    actionsToDocument,
    resetKey
  )

  const { createLiveCommand } = useCreateLiveCommandMutation(
    documentationState,
    actionsToDocument
  )
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

type CreateTargetedMaintenanceRunMutation =
  UseCreateMaintenanceRunMutationResult & {
    createTargetedMaintenanceRun: CreateMaintenanceRunType
  }

// A wrapper around useCreateMaintenanceRunMutation that ensures the ODD TakeoverModal renders, if applicable.
export function useCreateTargetedMaintenanceRunMutation(
  documentationState: DocumentationState,
  actionsToDocument: DocumentedAction[],
  options: UseCreateMaintenanceRunMutationOptions = {},
  hostOverride?: HostConfig | null
): CreateTargetedMaintenanceRunMutation {
  const createMaintenanceRunMutation = useCreateMaintenanceRunMutation(
    documentationState,
    actionsToDocument,
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
          if (isOnDevice) {
            setOddRunIds({ currentRunId: res.data.id, oddRunId: res.data.id })
          }
          return Promise.resolve(res)
        })
        .catch(error => error),
  }
}
