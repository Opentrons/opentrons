import {
  HostConfig,
  Run,
  createRun,
  CreateRunData,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'

export type UseCreateRunMutationResult = UseMutationResult<
  Run,
  unknown,
  void
> & {
  createRun: UseMutateFunction<Run, unknown, void>
}

export function useCreateRunMutation(
  createRunData: CreateRunData
): UseCreateRunMutationResult {
  const host = useHost()
  const mutation = useMutation<Run, unknown>(['run', host], () =>
    createRun(host as HostConfig, createRunData).then(response => response.data)
  )
  return {
    ...mutation,
    createRun: mutation.mutate,
  }
}
