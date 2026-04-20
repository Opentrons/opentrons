import { useMutation, useQueryClient } from 'react-query'

import { createCamera } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  AxiosError,
  CameraData,
  CameraResponse,
  ErrorResponse,
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
    async (data: CameraData) => {
      if (host == null) {
        throw new Error('Host config is required')
      }
      return await createCamera(host, data).then(response => {
        queryClient.invalidateQueries([host, 'camera']).catch((e: Error) => {
          throw e
        })
        return response.data
      })
    },
    options as Omit<
      UseMutationOptions<CameraResponse, AxiosError<ErrorResponse>, CameraData>,
      'mutationFn' | 'mutationKey'
    >
  )

  return {
    ...mutation,
    updateCamera: mutation.mutate,
  }
}
