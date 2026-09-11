/* eslint-disable opentrons/no-direct-mutating */

import { useMutation, useQueryClient } from 'react-query'
import { useDispatch, useStore } from 'react-redux'

import {
  createUser,
  deleteUser,
  getOAuth2Token,
  OAUTH2_CLIENT_ID,
  patchAccessControlEnabled,
  postResetConfig,
  restart,
} from '@opentrons/api-client'
import {
  accessControlEnabledQueryKey,
  useHost,
} from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import {
  beginRobotRestartTracking,
  RESTART_SUCCEEDED_STATUS,
} from '/app/redux/robot-admin'
import { type State } from '/app/redux/types'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import type { UseMutationResult } from 'react-query'
import type { CreateUserRequest } from '@opentrons/api-client'

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

const USER_NOTE =
  'Automatically done by the system as part of first-time setup of Compliance Ready Software.'

/**
 * Create initial accounts, flip the switch to enable Compliance Ready Software,
 * clear run history, and restart the robot.
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
  const robotName = hostConfig?.robotName
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const store = useStore<State>()

  const bootIdBeforeRestart =
    useRobot(hostConfig?.robotName ?? null)?.serverHealth?.bootId ?? null

  const enableCRS = async (params: EnableCRSParams): Promise<void> => {
    if (hostConfig == null || robotName == null) {
      throw Error(
        "hostConfig or robotName is null, couldn't enable CRS. Robot disconnected?"
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
      // This might happen if a prior attempt to enable CRS was interrupted.
      // It can also happen in dev, if users were left over from prior testing.
      try {
        await deleteUser(hostConfig, userToCreate.username)
      } catch {}
      await createUser(hostConfig, { data: userToCreate })
    }

    await patchAccessControlEnabled(hostConfig, {
      data: { accessControlEnabled: true },
    })

    // Now that accessControlEnabled is true, anything we do needs to be authorized.
    // Authenticate as one of the accounts we just created.
    const tokenResponse = await getOAuth2Token(hostConfig, {
      client_id: OAUTH2_CLIENT_ID,
      grant_type: 'password',
      username: params.adminAccount.username,
      password: params.adminAccount.password,
    })
    const hostConfigWithAccessToken: typeof hostConfig = {
      ...hostConfig,
      token: tokenResponse.data.access_token,
    }

    // Clear the run history, send the restart request, start tracking the restart
    // progress through Redux, and wait for the robot to come back online.
    //
    // Note: We can't use useResetRobotConfigMutation / useRestartRobotMutation
    // because those hooks capture HostConfig at render time, whereas we modify
    // our HostConfig midway through this procedure when we log in as the new
    // admin account.
    await postResetConfig(
      hostConfigWithAccessToken,
      { runsHistory: true },
      USER_NOTE
    )
    await restart(hostConfigWithAccessToken, USER_NOTE)
    for (const action of beginRobotRestartTracking(
      robotName,
      bootIdBeforeRestart
    )) {
      dispatch(action)
    }
    await waitForStoreCondition(
      store,
      state => state.robotAdmin[robotName]?.restart?.status ?? null,
      status => status === RESTART_SUCCEEDED_STATUS
    )

    // Make sure we fetch the new access control status (enabled) and that UI reflects
    // it before we return. At the time of writing, this doesn't matter because the
    // robot's restart makes everything reload anyway, so this is just future-proofing.
    await queryClient.invalidateQueries(
      accessControlEnabledQueryKey(hostConfig)
    )
  }

  // We're using just a plain react-query useMutation() here instead of
  // our usual wrapper around it, useDocumentedMutation(). The wrapper's extra stuff
  // to support Compliance Ready Software don't make sense here: we'll only ever run in
  // a context when Compliance Ready Software hasn't been enabled yet.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation(enableCRS)

  return mutation
}
