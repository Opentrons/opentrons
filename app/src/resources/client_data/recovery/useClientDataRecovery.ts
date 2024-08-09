import { useNotifyClientDataRecovery } from './useNotifyClientDataRecovery'

import type { UseQueryOptions } from 'react-query'
import type { AxiosError } from 'axios'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { ClientDataRecovery } from './types'

// Returns the client data store value associated with the error recovery key, if any.
export function useClientDataRecovery(
  options: UseQueryOptions<
    ClientDataResponse<ClientDataRecovery>,
    AxiosError
  > = {}
): ClientDataRecovery {
  const { data } = useNotifyClientDataRecovery(options)

  const { userId: userIdResponse, intent } = data?.data ?? {}
  const userId =
    userIdResponse != null && userIdResponse.length > 0 ? userIdResponse : null

  return { userId, intent: intent ?? null }
}
