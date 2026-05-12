import { omit } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { useUpdateClientData } from '@opentrons/react-api-client'

import { KEYS } from '../constants'
import { useClientDataEncryptionKeys } from './useClientDataEncryptionKeys'

import type {
  UseUpdateClientDataMutationOptions,
  UseUpdateClientDataMutationResult,
} from '@opentrons/react-api-client'
import type { ClientDataEncryptionKeys } from './types'

export type UseUpdateClientDataRecoveryResult = Omit<
  UseUpdateClientDataMutationResult<ClientDataEncryptionKeys>,
  'updateClientData'
> & {
  /* Add a new request to display the robot key. Returns the requested string to be used with clearKeyDisplay.*/
  requestKeyDisplay: () => string
  /* Clear the request (by nulling the nonce). */
  clearKeyDisplay: (request: string) => void
  /* Clear the clientData store at the error recovery key. */
  clearClientData: () => void
}

const uuid: () => string = uuidv4
// Update the client data store value associated with the error recovery key.
export function useUpdateClientDataEncryptionKeys(
  options: UseUpdateClientDataMutationOptions<ClientDataEncryptionKeys> = {}
): UseUpdateClientDataRecoveryResult {
  const { keyDisplayRequestedNonces } = useClientDataEncryptionKeys()
  const { updateClientData, ...mutate } =
    useUpdateClientData<ClientDataEncryptionKeys>(KEYS.ENCRYPTION_KEYS, options)
  console.log(`requested: ${keyDisplayRequestedNonces}`)
  const requestKeyDisplay = (): string => {
    const newRequest = uuid()
    updateClientData({
      keyDisplayRequestedNonces: {
        ...keyDisplayRequestedNonces,
        [newRequest]: true,
      },
    })
    console.log(`updated requests to add ${newRequest}`)
    return newRequest
  }
  const clearKeyDisplay = (request: string): void => {
    const currentRequests = omit(keyDisplayRequestedNonces, request)
    updateClientData({ keyDisplayRequestedNonces: currentRequests })
  }

  const clearClientData = (): void => {
    updateClientData({ keyDisplayRequestedNonces: {} })
  }

  return {
    ...mutate,
    requestKeyDisplay,
    clearKeyDisplay,
    clearClientData,
  }
}
