import { useQueryClient } from 'react-query'

import { patchAuditSettings } from '@opentrons/api-client'

import { useDocumentedMutation } from '../../accessControl'
import { getQueryKey, useHost } from '../../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AuditSettingsResponse,
  PatchAuditSettingsRequest,
} from '@opentrons/api-client'
import type { DocumentationState } from '../../accessControl'
import type { DocumentedMutationParameters } from '../../accessControl/types'

export type UseAuditSettingsMutationResult = UseMutationResult<
  AuditSettingsResponse,
  AxiosError,
  PatchAuditSettingsRequest
> & {
  patchAuditSettings: UseMutateFunction<
    AuditSettingsResponse,
    AxiosError,
    PatchAuditSettingsRequest
  >
}

export type UseAuditSettingsMutationOptions = UseMutationOptions<
  AuditSettingsResponse,
  AxiosError,
  PatchAuditSettingsRequest
>

export function useAuditSettingsMutation(
  documentationState: DocumentationState,
  options: UseAuditSettingsMutationOptions = {}
): UseAuditSettingsMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()
  const mutation = useDocumentedMutation<
    AuditSettingsResponse,
    AxiosError,
    PatchAuditSettingsRequest
  >(
    documentationState,
    ['update_audit_settings'],
    getQueryKey(host, 'audit', 'external', 'settings'),
    ({
      variables: body,
      userNotes,
    }: DocumentedMutationParameters<PatchAuditSettingsRequest>) =>
      patchAuditSettings(host!, body, userNotes)
        .then(response => {
          queryClient
            .invalidateQueries(
              getQueryKey(host, 'audit', 'external', 'settings')
            )
            .catch((e: Error) => {
              console.error(
                `error invalidating audit settings query: ${e.message}`
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
    patchAuditSettings: mutation.mutate,
  }
}
