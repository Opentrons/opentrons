import { useQueryClient } from 'react-query'

import { updateRobotSetting } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
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
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

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
  documentationState: DocumentationState,
  options: UseUpdateRobotSettingMutationOptions = {},
  hostOverride?: HostConfig | null
): UseUpdateRobotSettingMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    RobotSettingsResponse,
    AxiosError<ErrorResponse>,
    UpdateRobotSettingVariables
  >(
    documentationState,
    ['update_settings'],
    robotSettingsQueryKey(host),
    ({
      variables: { id, value },
      userNotes,
    }: DocumentedMutationParameters<UpdateRobotSettingVariables>) =>
      updateRobotSetting(host!, id, value, userNotes).then(response => {
        queryClient.setQueryData(robotSettingsQueryKey(host), response.data)
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    updateRobotSetting: mutation.mutate,
  }
}
