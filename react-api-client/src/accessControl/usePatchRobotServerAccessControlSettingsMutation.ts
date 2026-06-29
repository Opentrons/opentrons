import { useMutation } from 'react-query'

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

  const mutation = useMutation<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  >(
    getQueryKey(host, 'accessControl', 'settings', 'patch'),
    (body: PatchRobotServerAccessControlSettingsRequest) =>
      patchRobotServerAccessControlSettings(host!, body)
        .then(response => response.data)
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
