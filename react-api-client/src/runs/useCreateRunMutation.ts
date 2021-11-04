import {
  HostConfig,
  Run,
  RunType,
  createRun,
  CreateRunData,
} from '@opentrons/api-client'
import {
  UseMutationResult,
  useMutation,
  UseMutateFunction,
  UseMutationOptions,
} from 'react-query'
import { create } from 'react-test-renderer'
import { useHost } from '../api'

export type UseCreateRunMutationResult = UseMutationResult<
  Run,
  { [key: string]: unknown },
  CreateRunData
> & {
  createRun: UseMutateFunction<Run, { [key: string]: unknown }, CreateRunData>
}

export type UseCreateProtocolMutationOptions = UseMutationOptions<
  Run,
  {},
  CreateRunData
>

export function useCreateRunMutation(
  options: UseCreateProtocolMutationOptions = {}
): UseCreateRunMutationResult {
  const host = useHost()
  const mutation = useMutation<Run, { [key: string]: unknown }, CreateRunData>(
    [host, 'runs'],
    createRunData =>
      createRun(host as HostConfig, createRunData).then(
        response => response.data
      ),
    options
  )
  return {
    ...mutation,
    createRun: mutation.mutate,
  }
}
