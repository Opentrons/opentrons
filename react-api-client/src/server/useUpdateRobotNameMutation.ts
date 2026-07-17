import { useMutation, useQueryClient } from 'react-query'

import { updateRobotName } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { ErrorResponse, UpdatedRobotName } from '@opentrons/api-client'

export type UseUpdateRobotNameMutationResult = UseMutationResult<
  UpdatedRobotName,
  AxiosError<ErrorResponse>,
  string
> & {
  updateRobotName: UseMutateFunction<
    UpdatedRobotName,
    AxiosError<ErrorResponse>,
    string
  >
}

export type UseUpdateRobotNameMutationOptions = UseMutationOptions<
  UpdatedRobotName,
  AxiosError<ErrorResponse>,
  string
>

export function useUpdateRobotNameMutation(
  options: UseUpdateRobotNameMutationOptions = {}
): UseUpdateRobotNameMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useMutation<
    UpdatedRobotName,
    AxiosError<ErrorResponse>,
    string
  >(
    getQueryKey(host, 'server/name'),
    (newName: string) =>
      updateRobotName(host!, newName).then(response => {
        const robotName = response.data.name
        queryClient
          .invalidateQueries(getQueryKey(host, 'server/name'))
          .then(() =>
            queryClient.setQueryData(
              getQueryKey(host, 'server/name', robotName),
              response.data
            )
          )
          .catch((e: Error) => {
            throw e
          })
        return response.data
      }),
    options
  )
  return {
    ...mutation,
    updateRobotName: mutation.mutate,
  }
}
