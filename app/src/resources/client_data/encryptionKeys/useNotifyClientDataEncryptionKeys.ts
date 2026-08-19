import { useEffect } from 'react'

import { useClientData } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../../useNotifyDataReady'
import { KEYS } from '../constants'

import type { AxiosError } from 'axios'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { ClientDataEncryptionKeys } from './types'

export function useNotifyClientDataEncryptionKeys(
  options: UseQueryOptions<
    ClientDataResponse<ClientDataEncryptionKeys>,
    AxiosError
  > = {}
): UseQueryResult<ClientDataResponse<ClientDataEncryptionKeys>, AxiosError> {
  const { refetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/clientData/${KEYS.ENCRYPTION_KEYS}`,
    options,
  })

  const httpQueryResult = useClientData<ClientDataEncryptionKeys>(
    KEYS.ENCRYPTION_KEYS,
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
