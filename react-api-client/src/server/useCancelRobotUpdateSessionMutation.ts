import { useMutation } from 'react-query'

import { cancelRobotUpdateSession } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CancelRobotUpdateSessionData,
  HostConfig,
} from '@opentrons/api-client'

export interface CancelRobotUpdateSessionVariables {
  pathPrefix: string
  userNotes?: string
}

export type UseCancelRobotUpdateSessionMutationResult = UseMutationResult<
  CancelRobotUpdateSessionData,
  AxiosError,
  CancelRobotUpdateSessionVariables
> & {
  cancelRobotUpdateSession: UseMutateFunction<
    CancelRobotUpdateSessionData,
    AxiosError,
    CancelRobotUpdateSessionVariables
  >
}

export type UseCancelRobotUpdateSessionMutationOptions = UseMutationOptions<
  CancelRobotUpdateSessionData,
  AxiosError,
  CancelRobotUpdateSessionVariables
>

export function useCancelRobotUpdateSessionMutation(
  options: UseCancelRobotUpdateSessionMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCancelRobotUpdateSessionMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation<
    CancelRobotUpdateSessionData,
    AxiosError,
    CancelRobotUpdateSessionVariables
  >(
    variables =>
      cancelRobotUpdateSession(
        host!,
        variables.pathPrefix,
        variables.userNotes
      ).then(response => response.data),
    options
  )

  return {
    ...mutation,
    cancelRobotUpdateSession: mutation.mutate,
  }
}
