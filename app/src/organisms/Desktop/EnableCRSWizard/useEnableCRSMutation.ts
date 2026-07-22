import { useMutation } from 'react-query'

import { createUser, patchAccessControlEnabled } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

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

  const enableCRS = async (params: EnableCRSParams): Promise<void> => {
    if (hostConfig == null) {
      throw Error(
        "hostConfig is null, couldn't enable CRS. Robot disconnected?"
      )
    }

    // todo(mm, 2026-07-20): If the wizard was previously interrupted, these requests
    // will fail because the users already exist. We might want to clear preexisting
    // users beforehand.
    await createUser(hostConfig, {
      data: {
        accountType: 'admin',
        username: params.adminAccount.username,
        password: params.adminAccount.password,
        fullName: params.adminAccount.fullName,
      },
    })
    await createUser(hostConfig, {
      data: {
        accountType: 'admin',
        username: params.recoveryAccount.username,
        password: params.recoveryAccount.password,
        fullName: params.recoveryAccount.fullName,
      },
    })
    await createUser(hostConfig, {
      data: {
        accountType: 'admin',
        username: params.serviceAccount.username,
        password: params.serviceAccount.password,
        fullName: params.serviceAccount.fullName,
      },
    })

    await patchAccessControlEnabled(hostConfig, {
      data: { accessControlEnabled: true },
    })

    // TODO: Set the cache data
  }

  // We're using just a plain react-query useMutation() here instead of
  // our usual wrapper around it, useDocumentedMutation(). The wrapper's extra stuff
  // to support Compliance Ready Software don't make sense here: we'll only ever run in
  // a context when Compliance Ready Software hasn't been enabled yet.
  const mutation = useMutation(enableCRS)

  return mutation
}
