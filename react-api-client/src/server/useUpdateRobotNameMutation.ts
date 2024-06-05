import { useMutation, useQueryClient } from 'react-query'
import { updateRobotName } from '@opentrons/api-client'
import { useHost } from '../api'
import { getSanitizedQueryKeyObject } from '../utils'
import type {
  UseMutationResult,
  UseMutationOptions,
  UseMutateFunction,
} from 'react-query'
import type { AxiosError } from 'axios'
import type {
  ErrorResponse,
  HostConfig,
  UpdatedRobotName,
} from '@opentrons/api-client'

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
  const sanitizedHost = getSanitizedQueryKeyObject(host)

  const mutation = useMutation<
    UpdatedRobotName,
    AxiosError<ErrorResponse>,
    string
  >(
    [sanitizedHost, 'server/name'],
    (newName: string) =>
      updateRobotName(host as HostConfig, newName).then(response => {
        const robotName = response.data.name
        queryClient
          .invalidateQueries([sanitizedHost, 'server/name'])
          .then(() =>
            queryClient.setQueryData(
              [sanitizedHost, 'server/name', robotName],
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
