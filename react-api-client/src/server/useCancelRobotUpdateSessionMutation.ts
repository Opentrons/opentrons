import { cancelRobotUpdateSession } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
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
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export interface CancelRobotUpdateSessionVariables {
  pathPrefix: string
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
  documentationState: DocumentationState,
  options: UseCancelRobotUpdateSessionMutationOptions = {},
  hostOverride?: HostConfig | null
): UseCancelRobotUpdateSessionMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<
    CancelRobotUpdateSessionData,
    AxiosError,
    CancelRobotUpdateSessionVariables
  >(
    documentationState,
    ['update_robot_software'],
    ({
      variables,
      userNotes,
    }: DocumentedMutationParameters<CancelRobotUpdateSessionVariables>) =>
      cancelRobotUpdateSession(host!, variables.pathPrefix, userNotes).then(
        response => response.data
      ),
    options
  )

  return {
    ...mutation,
    cancelRobotUpdateSession: mutation.mutate,
  }
}
