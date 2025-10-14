import { useMutation, useQueryClient } from 'react-query'

import { createCamera } from '@opentrons/api-client'

import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type { UseMutationResult } from 'react-query'
import type {
  CameraData,
  CameraResponse,
  HostConfig,
} from '@opentrons/api-client'

export function useUpdateCamera(): UseMutationResult<
  CameraResponse,
  AxiosError,
  CameraData
> {
  const host = useHost()
  const queryClient = useQueryClient()
  return useMutation<CameraResponse, AxiosError, CameraData>(
    (data: CameraData) =>
      createCamera(host as HostConfig, data).then(res => res.data),
    {
      onSuccess: () => queryClient.invalidateQueries([host, 'camera']),
    }
  )
}
