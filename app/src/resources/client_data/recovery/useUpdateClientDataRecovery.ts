import { useUpdateClientData } from '@opentrons/react-api-client'
import { KEYS } from '../constants'

import type {
  UseUpdateClientDataMutationOptions,
  UseUpdateClientDataMutationResult,
} from '@opentrons/react-api-client'
import type { ClientDataRecovery } from './types'

export type UseUpdateClientDataRecoveryResult = Omit<
  UseUpdateClientDataMutationResult<ClientDataRecovery>,
  'updateClientData'
> & {
  /* Update the server with a given user id */
  updateUserId: (
    id: ClientDataRecovery['userId'],
    intent: ClientDataRecovery['intent']
  ) => ReturnType<
    UseUpdateClientDataMutationResult<ClientDataRecovery>['updateClientData']
  >
}

// Update the client data store value associated with the error recovery key.
export function useUpdateClientDataRecovery(
  options: UseUpdateClientDataMutationOptions<ClientDataRecovery> = {}
): UseUpdateClientDataRecoveryResult {
  const {
    updateClientData,
    ...mutate
  } = useUpdateClientData<ClientDataRecovery>(KEYS.ERROR_RECOVERY, options)

  const updateUserId = (
    id: ClientDataRecovery['userId'],
    intent: ClientDataRecovery['intent']
  ): ReturnType<
    UseUpdateClientDataMutationResult<ClientDataRecovery>['updateClientData']
  > => {
    updateClientData({ userId: id, intent })
  }

  return {
    ...mutate,
    updateUserId,
  }
}
