import Axios from 'axios'

import { deleteAllLabwareOffsets, postResetConfig } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  ResetConfigRequest,
  ResetConfigResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'
import type { DocumentedMutationParameters } from '../accessControl/types'

export type UsePostResetConfigMutationResult = UseMutationResult<
  ResetConfigResponse,
  AxiosError,
  ResetConfigRequest
> & {
  postResetConfig: UseMutateFunction<
    ResetConfigResponse,
    AxiosError,
    ResetConfigRequest
  >
}

export type UsePostResetConfigMutationOptions = UseMutationOptions<
  ResetConfigResponse,
  AxiosError,
  ResetConfigRequest
>

async function resetConfig(
  host: HostConfig,
  resets: ResetConfigRequest,
  userNotes: string
): Promise<ResetConfigResponse> {
  const settingsResetPromise = postResetConfig(
    host,
    resets.settingsResets,
    userNotes
  )

  const deleteOffsetsPromise = resets.resetLabwareOffsets
    ? deleteAllLabwareOffsets(host, userNotes).catch((error: unknown) => {
        // Older robot versions may not have this endpoint; treat 404 as success.
        if (Axios.isAxiosError(error) && error.response?.status === 404) {
          return { data: { data: null } }
        }
        throw error
      })
    : Promise.resolve(null)

  const [settingsResetResponse] = await Promise.all([
    settingsResetPromise,
    deleteOffsetsPromise,
  ])

  return settingsResetResponse.data
}

export function usePostResetConfigMutation(
  documentationState: DocumentationState,
  options: UsePostResetConfigMutationOptions = {},
  hostOverride?: HostConfig | null
): UsePostResetConfigMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useDocumentedMutation<
    ResetConfigResponse,
    AxiosError,
    ResetConfigRequest
  >(
    documentationState,
    ['reset_robot_config'],
    ({
      variables: resets,
      userNotes,
    }: DocumentedMutationParameters<ResetConfigRequest>) =>
      resetConfig(host!, resets, userNotes),
    options
  )

  return {
    ...mutation,
    postResetConfig: mutation.mutate,
  }
}
