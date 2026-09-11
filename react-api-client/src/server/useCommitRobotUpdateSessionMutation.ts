import { commitRobotUpdateSession } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CommitRobotUpdateSessionData,
  HostConfig,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export interface CommitRobotUpdateSessionVariables {
  pathPrefix: string
  token: string
}

export type UseCommitRobotUpdateSessionMutationResult = UseMutationResult<
  CommitRobotUpdateSessionData,
  AxiosError,
  CommitRobotUpdateSessionVariables
> & {
  commitRobotUpdateSession: UseMutateFunction<
    CommitRobotUpdateSessionData,
    AxiosError,
    CommitRobotUpdateSessionVariables
  >
}

export type UseCommitRobotUpdateSessionMutationOptions = UseMutationOptions<
  CommitRobotUpdateSessionData,
  AxiosError,
  CommitRobotUpdateSessionVariables
>

/**
 * Legacy fallback for robots that do not support auto_commit_and_restart.
 * Prefer the fire-and-forget begin-session path when the handshake succeeds.
 */
export function useCommitRobotUpdateSessionMutation(
  documentationState: DocumentationState,
  options: UseCommitRobotUpdateSessionMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCommitRobotUpdateSessionMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<
    CommitRobotUpdateSessionData,
    AxiosError,
    CommitRobotUpdateSessionVariables
  >(
    documentationState,
    ['update_robot_software'],
    ({
      variables,
      userNotes,
    }: DocumentedMutationParameters<CommitRobotUpdateSessionVariables>) =>
      commitRobotUpdateSession(
        host!,
        variables.pathPrefix,
        variables.token,
        userNotes
      ).then(response => response.data),
    options
  )

  return {
    ...mutation,
    commitRobotUpdateSession: mutation.mutate,
  }
}
