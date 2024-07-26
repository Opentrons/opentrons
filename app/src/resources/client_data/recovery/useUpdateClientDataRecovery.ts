import { useUpdateClientData } from '@opentrons/react-api-client'
import { useSelector } from 'react-redux'

import { getUserId } from '../../../redux/config'
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
  /* Update the server with the user's id and a recovery intent. */
  updateWithIntent: (
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
  const thisUserId = useSelector(getUserId)

  const updateWithIntent = (
    intent: ClientDataRecovery['intent']
  ): ReturnType<
    UseUpdateClientDataMutationResult<ClientDataRecovery>['updateClientData']
  > => {
    updateClientData({ userId: thisUserId, intent })
  }

  return {
    ...mutate,
    updateWithIntent,
  }
}
