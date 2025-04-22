import { useClientData } from '@opentrons/react-api-client'

import { useNotifyDataReady } from '../../useNotifyDataReady'
import { KEYS } from '../constants'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { QueryOptionsWithPolling } from '../../useNotifyDataReady'
import type { ClientDataLPC } from './types'

export function useNotifyClientDataLPC(
  options: QueryOptionsWithPolling<
    ClientDataResponse<ClientDataLPC>,
    AxiosError
  > = {}
): UseQueryResult<ClientDataResponse<ClientDataLPC>, AxiosError> {
  const { shouldRefetch, queryOptionsNotify } = useNotifyDataReady({
    topic: `robot-server/clientData/${KEYS.LPC}`,
    options,
  })

  const httpQueryResult = useClientData<ClientDataLPC>(
    KEYS.LPC,
    queryOptionsNotify
  )

  if (shouldRefetch) {
    void httpQueryResult.refetch()
  }

  return httpQueryResult
}
