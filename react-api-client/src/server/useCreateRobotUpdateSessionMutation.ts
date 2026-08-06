import { createRobotUpdateSession } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CreateRobotUpdateSessionData,
  HostConfig,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export interface CreateRobotUpdateSessionVariables {
  sessionPath: string
  autoCommitAndRestart: boolean
}

export type UseCreateRobotUpdateSessionMutationResult = UseMutationResult<
  CreateRobotUpdateSessionData,
  AxiosError,
  CreateRobotUpdateSessionVariables
> & {
  createRobotUpdateSession: UseMutateFunction<
    CreateRobotUpdateSessionData,
    AxiosError,
    CreateRobotUpdateSessionVariables
  >
}

export type UseCreateRobotUpdateSessionMutationOptions = UseMutationOptions<
  CreateRobotUpdateSessionData,
  AxiosError,
  CreateRobotUpdateSessionVariables
>

export function useCreateRobotUpdateSessionMutation(
  documentationState: DocumentationState,
  options: UseCreateRobotUpdateSessionMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCreateRobotUpdateSessionMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<
    CreateRobotUpdateSessionData,
    AxiosError,
    CreateRobotUpdateSessionVariables
  >(
    documentationState,
    ['update_robot_software'],
    ({
      variables,
      userNotes,
    }: DocumentedMutationParameters<CreateRobotUpdateSessionVariables>) =>
      createRobotUpdateSession(
        host!,
        variables.sessionPath,
        { auto_commit_and_restart: variables.autoCommitAndRestart },
        userNotes
      ).then(response => response.data),
    options
  )

  return {
    ...mutation,
    createRobotUpdateSession: mutation.mutate,
  }
}
