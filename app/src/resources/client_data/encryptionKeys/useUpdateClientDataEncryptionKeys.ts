import { omit } from 'lodash'
import { v4 as uuidv4 } from 'uuid'

import { useReadModifyWriteClientData } from '@opentrons/react-api-client'

import { KEYS } from '../constants'

import type {
  UseReadModifyWriteClientDataMutationOptions,
  UseReadModifyWriteClientDataMutationResult,
} from '@opentrons/react-api-client'
import type { ClientDataEncryptionKeys } from './types'

export type UseUpdateClientDataRecoveryResult = Omit<
  UseReadModifyWriteClientDataMutationResult<ClientDataEncryptionKeys>,
  'readModifyWriteClientData'
> & {
  /* Add a new request to display the robot key. Returns the requested string to be used with clearKeyDisplay. */
  requestKeyDisplay: () => string
  /* Clear the request (by nulling the nonce). */
  clearKeyDisplay: (request: string) => void
  /* Clear the clientData store at the error recovery key. */
  clearClientData: () => void
}

const uuid: () => string = uuidv4
// Update the client data store value associated with the error recovery key.
export function useUpdateClientDataEncryptionKeys(
  options: UseReadModifyWriteClientDataMutationOptions<ClientDataEncryptionKeys> = {}
): UseUpdateClientDataRecoveryResult {
  const { readModifyWriteClientData, ...mutate } =
    useReadModifyWriteClientData<ClientDataEncryptionKeys>(
      KEYS.ENCRYPTION_KEYS,
      options
    )

  const requestKeyDisplay = (): string => {
    const newRequest = uuid()
    readModifyWriteClientData(encryptionData => ({
      keyDisplayRequestedNonces: {
        ...(encryptionData?.keyDisplayRequestedNonces ?? {}),
        [newRequest]: true,
      },
    }))
    return newRequest
  }
  const clearKeyDisplay = (request: string): void => {
    readModifyWriteClientData(encryptionData => ({
      keyDisplayRequestedNonces: encryptionData?.keyDisplayRequestedNonces
        ? omit(encryptionData.keyDisplayRequestedNonces, request)
        : {},
    }))
  }

  const clearClientData = (): void => {
    readModifyWriteClientData(() => ({ keyDisplayRequestedNonces: {} }))
  }

  return {
    ...mutate,
    requestKeyDisplay,
    clearKeyDisplay,
    clearClientData,
  }
}
