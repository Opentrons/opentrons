import { useMutation } from 'react-query'

import { commitRobotUpdateSession } from '@opentrons/api-client'

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

export interface CommitRobotUpdateSessionVariables {
  pathPrefix: string
  token: string
  userNotes?: string
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
  options: UseCommitRobotUpdateSessionMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCommitRobotUpdateSessionMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<
    CommitRobotUpdateSessionData,
    AxiosError,
    CommitRobotUpdateSessionVariables
  >(
    variables =>
      commitRobotUpdateSession(
        host!,
        variables.pathPrefix,
        variables.token,
        variables.userNotes
      ).then(response => response.data),
    options
  )

  return {
    ...mutation,
    commitRobotUpdateSession: mutation.mutate,
  }
}
