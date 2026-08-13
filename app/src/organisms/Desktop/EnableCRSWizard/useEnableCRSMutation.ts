/* eslint-disable opentrons/no-direct-mutating */

import { useMutation, useQueryClient } from 'react-query'

import {
  createUser,
  CreateUserRequest,
  deleteUser,
  patchAccessControlEnabled,
} from '@opentrons/api-client'
import {
  accessControlEnabledQueryKey,
  useHost,
} from '@opentrons/react-api-client'

import type { UseMutationResult } from 'react-query'

export interface EnableCRSParams {
  adminAccount: AccountCreationParams
  serviceAccount: AccountCreationParams
  recoveryAccount: AccountCreationParams
}

interface AccountCreationParams {
  username: string
  password: string
  fullName: string
}

/**
 * Create an admin account, a service account, a recovery account,
 * and finally flip the switch to enable Compliance Ready Software.
 *
 * We do this all in one batch at the end of the wizard to reduce the chances of it
 * getting interrupted and leaving the robot in a half-set-up state. Though it's still
 * possible, since the backend API doesn't support doing this atomically.
 */
export function useEnableCRSMutation(): UseMutationResult<
  void,
  unknown,
  EnableCRSParams
> {
  const hostConfig = useHost()
  const queryClient = useQueryClient()

  const enableCRS = async (params: EnableCRSParams): Promise<void> => {
    if (hostConfig == null) {
      throw Error(
        "hostConfig is null, couldn't enable CRS. Robot disconnected?"
      )
    }

    const usersToCreate: Array<CreateUserRequest['data']> = [
      {
        accountType: 'admin',
        username: params.adminAccount.username,
        password: params.adminAccount.password,
        fullName: params.adminAccount.fullName,
      },
      {
        accountType: 'admin',
        username: params.recoveryAccount.username,
        password: params.recoveryAccount.password,
        fullName: params.recoveryAccount.fullName,
      },
      {
        accountType: 'service',
        username: params.serviceAccount.username,
        password: params.serviceAccount.password,
        fullName: params.serviceAccount.fullName,
      },
    ]
    for (const userToCreate of usersToCreate) {
      // If the user already exists, try deleting it to make room for our new one.
      // This should never happen in normal production use, but it might happen in dev--
      // users might be left over from prior testing.
      try {
        await deleteUser(hostConfig, userToCreate.username)
      } catch {}
      await createUser(hostConfig, { data: userToCreate })
    }

    const response = await patchAccessControlEnabled(hostConfig, {
      data: { accessControlEnabled: true },
    })
    queryClient.setQueryData(
      accessControlEnabledQueryKey(hostConfig),
      response.data
    )

    // The designs also call for a robot restart here.
    // The backend doesn't actually need that, at the time of writing,
    // so it's left out for now.
  }

  // We're using just a plain react-query useMutation() here instead of
  // our usual wrapper around it, useDocumentedMutation(). The wrapper's extra stuff
  // to support Compliance Ready Software don't make sense here: we'll only ever run in
  // a context when Compliance Ready Software hasn't been enabled yet.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation(enableCRS)

  return mutation
}
