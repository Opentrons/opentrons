import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useSelector } from 'react-redux'

import {
  useCreateProtocolMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { getValidCustomLabwareFiles } from '/app/redux/custom-labware/selectors'

import type { UseMutateFunction } from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  LegacyLabwareOffsetCreateData,
  Protocol,
} from '@opentrons/api-client'
import type { CreateProtocolVariables } from '@opentrons/react-api-client/src/protocols/useCreateProtocolMutation'
import type { UseCreateRunMutationOptions } from '@opentrons/react-api-client/src/runs/useCreateRunMutation'
import type { State } from '/app/redux/types'

export interface UseCreateRun {
  createRunFromProtocolSource: UseMutateFunction<
    Protocol,
    unknown,
    CreateProtocolVariables,
    unknown
  >
  isCreatingRun: boolean
  runCreationError: string | null
  runCreationErrorCode: number | null
  reset: () => void
}

export function useCreateRunFromProtocol(
  options: UseCreateRunMutationOptions,
  hostOverride?: HostConfig | null,
  labwareOffsets?: LegacyLabwareOffsetCreateData[]
): UseCreateRun {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
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
        void queryClient.invalidateQueries([host, 'runs']).catch((e: Error) => {
          console.error(`error invalidating runs query: ${e.message}`)
        })
        void options.onSuccess?.(...args)
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
      onSuccess: (data, { runTimeParameterValues, runTimeParameterFiles }) => {
        createRun({
          protocolId: data.data.id,
          labwareOffsets,
          runTimeParameterValues,
          runTimeParameterFiles,
        })
      },
    },
    host
  )

  const protocolErrorData = protocolError?.response?.data as
    | ErrorResponse
    | string
    | undefined
  const runErrorData = runError?.response?.data as
    | ErrorResponse
    | string
    | undefined

  let error =
    protocolError != null || runError != null
      ? ((protocolErrorData != null && typeof protocolErrorData !== 'string'
          ? protocolErrorData.errors?.[0]?.detail
          : protocolErrorData) ??
        (runErrorData != null && typeof runErrorData !== 'string'
          ? runErrorData.errors?.[0]?.detail
          : runErrorData) ??
        t('protocol_run_general_error_msg'))
      : null
  error != null && console.error(error)
  error = error?.length > 255 ? t('protocol_run_general_error_msg') : error

  const errorCode =
    protocolError?.response?.status ?? runError?.response?.status ?? null

  return {
    createRunFromProtocolSource: (
      {
        files: srcFiles,
        protocolKey,
        runTimeParameterValues,
        runTimeParameterFiles,
      },
      ...args
    ) => {
      resetRunMutation()
      createProtocolRun(
        {
          files: [...srcFiles, ...customLabwareFiles],
          protocolKey,
          runTimeParameterValues,
          runTimeParameterFiles,
        },
        ...args
      )
    },
    isCreatingRun: isCreatingProtocol || isCreatingRun,
    runCreationError: error,
    runCreationErrorCode: errorCode,
    reset: () => {
      resetProtocolMutation()
      resetRunMutation()
    },
  }
}
