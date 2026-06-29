import { useMutation, useQueryClient } from 'react-query'

import { patchRobotServerAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateAsyncFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  PatchRobotServerAccessControlSettingsRequest,
  RobotServerAccessControlSettingsResponse,
} from '@opentrons/api-client'

export type UsePatchRobotServerAccessControlSettingsMutationResult =
  UseMutationResult<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  > & {
    patchRobotServerAccessControlSettings: UseMutateAsyncFunction<
      RobotServerAccessControlSettingsResponse,
      AxiosError,
      PatchRobotServerAccessControlSettingsRequest
    >
  }

export function usePatchRobotServerAccessControlSettingsMutation(
  options: UseMutationOptions<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  > = {}
): UsePatchRobotServerAccessControlSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  >(
    getQueryKey(host, 'accessControl', 'settings', 'patch'),
    (body: PatchRobotServerAccessControlSettingsRequest) =>
      patchRobotServerAccessControlSettings(host!, body)
        .then(response => {
          queryClient
            .invalidateQueries(getQueryKey(host, 'accessControl', 'settings'))
            .catch((e: Error) => {
              console.error(
                `error invalidating robot server access control settings query: ${e.message}`
              )
            })
          return response.data
        })
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchRobotServerAccessControlSettings: mutation.mutateAsync,
  }
}
