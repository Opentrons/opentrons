import { useQueryClient } from 'react-query'

import { createCamera } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  CameraData,
  CameraResponse,
  ErrorResponse,
} from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

export type UseUpdateCameraMutationResult = UseMutationResult<
  CameraResponse,
  AxiosError<ErrorResponse>,
  CameraData
> & {
  updateCamera: UseMutateFunction<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraData
  >
}

export function useUpdateCamera(
  documentationState: DocumentationState,
  options: UseMutationOptions<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraData
  > = {}
): UseUpdateCameraMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraData
  >(
    documentationState,
    ['update_camera'],
    getQueryKey(host, 'camera'),
    ({ variables: data, userNotes }) =>
      createCamera(host!, data, userNotes).then(response => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'camera'))
          .catch((e: Error) => {
            throw e
          })
        return response.data
      }),
    options
  )

  return {
    ...mutation,
    updateCamera: mutation.mutate,
  }
}
