import { useMutation, useQueryClient } from 'react-query'

import { createCamera } from '@opentrons/api-client'

import { useHost } from '../api'

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
  HostConfig,
} from '@opentrons/api-client'

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
  options: UseMutationOptions<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraData
  > = {}
): UseUpdateCameraMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    CameraResponse,
    AxiosError<ErrorResponse>,
    CameraData
  >(
    [host, 'camera'],
    (data: CameraData) =>
      createCamera(host as HostConfig, data).then(response => {
        queryClient.invalidateQueries([host, 'camera']).catch((e: Error) => {
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
