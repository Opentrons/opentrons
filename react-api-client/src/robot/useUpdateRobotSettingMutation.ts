import { useMutation, useQueryClient } from 'react-query'

import { updateRobotSetting } from '@opentrons/api-client'

import { useHost } from '../api'
import { robotSettingsQueryKey } from './useRobotSettingsQuery'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  RobotSettingsResponse,
} from '@opentrons/api-client'

export interface UpdateRobotSettingVariables {
  id: string
  value: boolean
}

export type UseUpdateRobotSettingMutationResult = UseMutationResult<
  RobotSettingsResponse,
  AxiosError<ErrorResponse>,
  UpdateRobotSettingVariables
> & {
  updateRobotSetting: UseMutateFunction<
    RobotSettingsResponse,
    AxiosError<ErrorResponse>,
    UpdateRobotSettingVariables
  >
}

export type UseUpdateRobotSettingMutationOptions = UseMutationOptions<
  RobotSettingsResponse,
  AxiosError<ErrorResponse>,
  UpdateRobotSettingVariables
>

export function useUpdateRobotSettingMutation(
  options: UseUpdateRobotSettingMutationOptions = {},
  hostOverride?: HostConfig | null
): UseUpdateRobotSettingMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useMutation<
    RobotSettingsResponse,
    AxiosError<ErrorResponse>,
    UpdateRobotSettingVariables
  >(
    robotSettingsQueryKey(host),
    ({ id, value }) =>
      updateRobotSetting(host!, id, value).then(response => {
        queryClient.setQueryData(
          robotSettingsQueryKey(host),
          response.data
        )
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    updateRobotSetting: mutation.mutate,
  }
}
