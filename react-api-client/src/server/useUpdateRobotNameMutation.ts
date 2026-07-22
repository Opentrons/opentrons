import { useQueryClient } from 'react-query'

import { updateRobotName } from '@opentrons/api-client'

import { useDocumentedMutation } from '../accessControl'
import { getQueryKey, useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type { ErrorResponse, UpdatedRobotName } from '@opentrons/api-client'
import type { DocumentationState } from '../accessControl'

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
  documentationState: DocumentationState,
  options: UseUpdateRobotNameMutationOptions = {}
): UseUpdateRobotNameMutationResult {
  const host = useHost()
  const queryClient = useQueryClient()

  const mutation = useDocumentedMutation<
    UpdatedRobotName,
    AxiosError<ErrorResponse>,
    string
  >(
    documentationState,
    ['update_robot_name'],
    ({ variables: newName, userNotes }) =>
      updateRobotName(host!, newName, userNotes).then(response => {
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
