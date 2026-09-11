import { useEffect } from 'react'

import { useClientData } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../../useNotifyDataReady'
import { KEYS } from '../constants'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { ClientDataRecovery } from './types'

export function useNotifyClientDataRecovery(
  options: UseQueryOptions<
    ClientDataResponse<ClientDataRecovery>,
    AxiosError
  > = {}
): UseQueryResult<ClientDataResponse<ClientDataRecovery>, AxiosError> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/clientData/${KEYS.ERROR_RECOVERY}`,
    options,
  })

  const httpQueryResult = useClientData<ClientDataRecovery>(
    KEYS.ERROR_RECOVERY,
    queryOptionsNotify
  )
  const { refetch: refetchQuery } = httpQueryResult

  useEffect(() => {
    if (refetch > 0) {
      void refetchQuery()
    }
  }, [refetch, refetchQuery])

  return httpQueryResult
}
