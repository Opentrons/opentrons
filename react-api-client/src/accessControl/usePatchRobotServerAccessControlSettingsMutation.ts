import { useQueryClient } from 'react-query'

import { patchRobotServerAccessControlSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'
import { useDocumentedMutation } from './useDocumentedMutation'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  PatchRobotServerAccessControlSettingsRequest,
  RobotServerAccessControlSettingsResponse,
} from '@opentrons/api-client'
import type { DocumentationState, DocumentedMutationParameters } from './types'

export type UsePatchRobotServerAccessControlSettingsMutationResult =
  UseMutationResult<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  > & {
    patchRobotServerAccessControlSettings: UseMutateFunction<
      RobotServerAccessControlSettingsResponse,
      AxiosError,
      PatchRobotServerAccessControlSettingsRequest
    >
  }

export type UsePatchRobotServerAccessControlSettingsMutationOptions =
  UseMutationOptions<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  >

export function usePatchRobotServerAccessControlSettingsMutation(
  documentationState: DocumentationState,
  options: UsePatchRobotServerAccessControlSettingsMutationOptions = {}
): UsePatchRobotServerAccessControlSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    RobotServerAccessControlSettingsResponse,
    AxiosError,
    PatchRobotServerAccessControlSettingsRequest
  >(
    documentationState,
    ['patch_robot_server_crs_settings'],
    getQueryKey(host, 'accessControl', 'settings', 'patch'),
    ({
      variables: body,
      userNotes,
    }: DocumentedMutationParameters<PatchRobotServerAccessControlSettingsRequest>) =>
      patchRobotServerAccessControlSettings(host!, body, userNotes)
        .then(response => {
          queryClient.setQueryData(
            getQueryKey(host, 'accessControl', 'settings'),
            response.data
          )
          return response.data
        })
        .catch((e: AxiosError) => {
          throw e
        }),
    options
  )

  return {
    ...mutation,
    patchRobotServerAccessControlSettings: mutation.mutate,
  }
}
