import { useMutation } from 'react-query'
import { deleteCalibration } from '@opentrons/api-client'
import { useHost } from '../api'

import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type {
  HostConfig,
  EmptyResponse,
  DeleteCalRequestParams,
} from '@opentrons/api-client'

export type UseDeleteCalibrationMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  DeleteCalRequestParams
> & {
  deleteCalibration: UseMutateFunction<
    EmptyResponse,
    unknown,
    DeleteCalRequestParams
  >
}

export type UseDeleteCalibrationMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  DeleteCalRequestParams
>

export function useDeleteCalibrationMutation(
  options: UseDeleteCalibrationMutationOptions = {}
): UseDeleteCalibrationMutationResult {
  const host = useHost()

  const mutation = useMutation<EmptyResponse, unknown, DeleteCalRequestParams>(
    (requestParams: DeleteCalRequestParams) =>
      deleteCalibration(host as HostConfig, requestParams).then(
        response => response.data
      ),
    options
  )

  return {
    ...mutation,
    deleteCalibration: mutation.mutate,
  }
}
