import { useNotifyClientDataEncryptionKeys } from './useNotifyClientDataEncryptionKeys'

import type { AxiosError } from 'axios'
import type { UseQueryOptions } from 'react-query'
import type { ClientDataResponse } from '@opentrons/api-client'
import type { ClientDataEncryptionKeys } from './types'

// Returns the client data store value associated with the error recovery key, if any.
export function useClientDataEncryptionKeys(
  options: UseQueryOptions<
    ClientDataResponse<ClientDataEncryptionKeys>,
    AxiosError
  > = {}
): ClientDataEncryptionKeys {
  const { data } = useNotifyClientDataEncryptionKeys(options)

  return {
    keyDisplayRequestedNonces: data?.data?.keyDisplayRequestedNonces ?? {},
  }
}
