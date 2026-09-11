import { useMutation } from 'react-query'

import { deleteCalibration } from '@opentrons/api-client'

import { useHost } from '../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  DeleteCalRequestParams,
  EmptyResponse,
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

  // OT-2 only.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation<EmptyResponse, unknown, DeleteCalRequestParams>(
    (requestParams: DeleteCalRequestParams) =>
      deleteCalibration(host!, requestParams).then(response => response.data),
    options
  )

  return {
    ...mutation,
    deleteCalibration: mutation.mutate,
  }
}
