import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import { useSelector } from 'react-redux'

import {
  getQueryKey,
  useCreateProtocolMutation,
  useCreateRunMutation,
  useHost,
} from '@opentrons/react-api-client'

import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { getValidCustomLabwareFiles } from '/app/redux/custom-labware/selectors'

import type { UseMutateFunction } from 'react-query'
import type {
  HostConfig,
  LegacyLabwareOffsetCreateData,
  Protocol,
} from '@opentrons/api-client'
import type { DocumentedAction } from '@opentrons/react-api-client'
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
  labwareOffsets?: LegacyLabwareOffsetCreateData[],
  actionsToDocument?: DocumentedAction[]
): UseCreateRun {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const queryClient = useQueryClient()
  const { t } = useTranslation('shared')

  const customLabwareFiles = useSelector((state: State) =>
    getValidCustomLabwareFiles(state)
  )

  const { documentationState, clearDocreport } = useLinkedDocumentationState(
    [...(actionsToDocument ?? []), 'create_protocol', 'play_run'],
    host?.robotName ?? null,
    host?.robotName,
    host
  )

  const {
    createRun,
    isLoading: isCreatingRun,
    reset: resetRunMutation,
    error: runError,
  } = useCreateRunMutation(
    documentationState,
    {
      ...options,
      onSuccess: (...args) => {
        queryClient
          .invalidateQueries(getQueryKey(host, 'runs'))
          .catch((e: Error) => {
            console.error(`error invalidating runs query: ${e.message}`)
          })
        options.onSuccess?.(...args)
      },
      onError: (error, variables, context) => {
        clearDocreport()
        options.onError?.(error, variables, context)
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
    documentationState,
    {
      onSuccess: (data, { runTimeParameterValues, runTimeParameterFiles }) => {
        createRun({
          protocolId: data.data.id,
          labwareOffsets,
          runTimeParameterValues,
          runTimeParameterFiles,
        })
      },
      onError: () => {
        clearDocreport()
      },
    },
    host
  )

  let error =
    protocolError != null || runError != null
      ? (protocolError?.response?.data?.errors?.[0]?.detail ??
        protocolError?.response?.data ??
        runError?.response?.data?.errors?.[0]?.detail ??
        runError?.response?.data ??
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
      clearDocreport()
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
      clearDocreport()
      resetProtocolMutation()
      resetRunMutation()
    },
  }
}
