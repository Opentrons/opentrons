import { useCallback } from 'react'

import { useClientData, useUpdateClientData } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../../useNotifyDataReady'
import { KEYS } from '../constants'

import type { AxiosError } from 'axios'
import type { UseMutationOptions, UseQueryOptions } from 'react-query'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { LogDeletionStatus } from './types'

export function useClientDataLogDeletion(
  logPeriodId: string,
  options: UseQueryOptions<
    ClientDataResponse<LogDeletionStatus>,
    AxiosError
  > = {}
): 'pending' | 'completed' | 'failed' {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/clientData/${KEYS.LOG_DELETION}`,
    options,
  })

  const httpQueryResult = useClientData<LogDeletionStatus>(
    KEYS.LOG_DELETION,
    queryOptionsNotify
  )

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  const { data } = httpQueryResult

  const logDeletionStatus =
    data?.data?.logPeriodId === logPeriodId ? data?.data?.status : 'pending'

  return logDeletionStatus
}

export function useUpdateClientDataLogDeletion(
  logPeriodId: string,
  options: UseMutationOptions<
    ClientDataResponse<LogDeletionStatus>,
    AxiosError,
    LogDeletionStatus
  > = {}
): (status: 'completed' | 'failed' | 'pending') => void {
  const { updateClientData } = useUpdateClientData<LogDeletionStatus>(
    KEYS.LOG_DELETION,
    options
  )
  const updateClientDataLogDeletion = useCallback(
    (status: 'completed' | 'failed' | 'pending') => {
      updateClientData({
        logPeriodId,
        status,
      })
    },
    [logPeriodId, updateClientData]
  )

  return updateClientDataLogDeletion
}
