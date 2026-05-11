import { v4 as uuidv4 } from 'uuid'

import { useUpdateClientData } from '@opentrons/react-api-client'

import { KEYS } from '../constants'

import type {
  UseUpdateClientDataMutationOptions,
  UseUpdateClientDataMutationResult,
} from '@opentrons/react-api-client'
import type { ClientDataEncryptionKeys } from './types'

export type UseUpdateClientDataRecoveryResult = Omit<
  UseUpdateClientDataMutationResult<ClientDataEncryptionKeys>,
  'updateClientData'
> & {
  /* Add a new request (by altering a nonce) to display the robot key. */
  requestKeyDisplay: () => void
  /* Clear the request (by nulling the nonce). */
  clearKeyDisplay: () => void
  /* Clear the clientData store at the error recovery key. */
  clearClientData: () => void
}

const uuid: () => string = uuidv4
// Update the client data store value associated with the error recovery key.
export function useUpdateClientDataEncryptionKeys(
  options: UseUpdateClientDataMutationOptions<ClientDataEncryptionKeys> = {}
): UseUpdateClientDataRecoveryResult {
  const { updateClientData, ...mutate } =
    useUpdateClientData<ClientDataEncryptionKeys>(KEYS.ERROR_RECOVERY, options)

  const requestKeyDisplay = (): void => {
    updateClientData({ keyDisplayRequestedNonce: uuid() })
  }
  const clearKeyDisplay = (): void => {
    updateClientData({ keyDisplayRequestedNonce: null })
  }

  const clearClientData = (): void => {
    updateClientData({ keyDisplayRequestedNonce: null })
  }

  return {
    ...mutate,
    requestKeyDisplay,
    clearKeyDisplay,
    clearClientData,
  }
}
