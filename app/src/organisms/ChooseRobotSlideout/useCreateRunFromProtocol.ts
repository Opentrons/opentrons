import * as React from 'react'
import { useQueryClient } from 'react-query'
import {
  useHost,
  useCreateProtocolMutation,
  useCreateRunMutation,
} from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { getValidCustomLabwareFiles } from '../../redux/custom-labware/selectors'

import type { UseMutateFunction } from 'react-query'
import type { HostConfig, Protocol } from '@opentrons/api-client'
import type { UseCreateRunMutationOptions } from '@opentrons/react-api-client/src/runs/useCreateRunMutation'
import type { CreateProtocolVariables } from '@opentrons/react-api-client/src/protocols/useCreateProtocolMutation'
import type { State } from '../../redux/types'

export interface UseCreateRun {
  createRunFromProtocolSource: UseMutateFunction<
    Protocol,
    unknown,
    CreateProtocolVariables,
    unknown
  >
  isCreatingRun: boolean
  runCreationError: string | null
  reset: () => void
}

export function useCreateRunFromProtocol(
  options: UseCreateRunMutationOptions,
  hostOverride?: HostConfig | null
): UseCreateRun {
  const contextHost = useHost()
  const host = hostOverride ?? contextHost
  const queryClient = useQueryClient()
  const { t } = useTranslation('shared')

  const customLabwareFiles = useSelector((state: State) =>
    getValidCustomLabwareFiles(state)
  )

  const {
    createRun,
    isLoading: isCreatingRun,
    reset: resetRunMutation,
    error: runError,
  } = useCreateRunMutation(
    {
      ...options,
      onSuccess: (...args) => {
        queryClient
          .invalidateQueries([host, 'runs'])
          .catch((e: Error) =>
            console.error(`error invalidating runs query: ${e.message}`)
          )
        options.onSuccess?.(...args)
      },
    },
    host
  )
  const {
    createProtocol: createProtocolRun,
    isLoading: isCreatingProtocol,
    error: protocolError,
    reset: resetProtocolMutation,
  } = useCreateProtocolMutation(
    {
      onSuccess: data => {
        createRun({ protocolId: data.data.id })
      },
    },
    host
  )

  const error =
    protocolError != null || runError != null
      ? protocolError?.response?.data?.errors?.[0]?.detail ??
        protocolError?.response?.data ??
        runError?.response?.data?.errors?.[0]?.detail ??
        runError?.response?.data ??
        t('protocol_run_general_error_msg')
      : null

  return {
    createRunFromProtocolSource: (
      { files: srcFiles, protocolKey },
      ...args
    ) => {
      resetRunMutation()
      createProtocolRun(
        { files: [...srcFiles, ...customLabwareFiles], protocolKey },
        ...args
      )
    },
    isCreatingRun: isCreatingProtocol || isCreatingRun,
    runCreationError: error,
    reset: () => {
      resetProtocolMutation()
      resetRunMutation()
    },
  }
}
