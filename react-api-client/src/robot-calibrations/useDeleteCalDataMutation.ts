import { useMutation } from 'react-query'
import { deleteCalData } from '@opentrons/api-client'
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

export type UseDeleteCalDataMutationResult = UseMutationResult<
  EmptyResponse,
  unknown,
  DeleteCalRequestParams
> & {
  deleteCalData: UseMutateFunction<
    EmptyResponse,
    unknown,
    DeleteCalRequestParams
  >
}

export type UseDeleteCalDataMutationOptions = UseMutationOptions<
  EmptyResponse,
  unknown,
  DeleteCalRequestParams
>

export function useDeleteCalDataMutation(
  options: UseDeleteCalDataMutationOptions = {}
): UseDeleteCalDataMutationResult {
  const host = useHost()

  const mutation = useMutation<EmptyResponse, unknown, DeleteCalRequestParams>(
    (requestParams: DeleteCalRequestParams) =>
      deleteCalData(host as HostConfig, requestParams).then(
        response => response.data
      ),
    options
  )

  return {
    ...mutation,
    deleteCalData: mutation.mutate,
  }
}
