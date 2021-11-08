import {
  HostConfig,
  Run,
  createRun,
  CreateRunData,
} from '@opentrons/api-client'
import { UseMutationResult, useMutation, UseMutateFunction } from 'react-query'
import { useHost } from '../api'

export type UseCreateRunMutationResult = UseMutationResult<Run, Error, void> & {
  createRun: UseMutateFunction<Run>
}

export function useCreateRunMutation(
  createRunData: CreateRunData
): UseCreateRunMutationResult {
  const host = useHost()
  const mutation = useMutation<Run, Error>(['run', host], () =>
    createRun(host as HostConfig, createRunData)
      .then(response => response.data)
      .catch((e: Error) => {
        throw e
      })
  )
  return {
    ...mutation,
    createRun: mutation.mutate,
  }
}
