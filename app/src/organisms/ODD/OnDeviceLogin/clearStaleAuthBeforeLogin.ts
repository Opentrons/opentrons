import { fetchSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'
import { store } from '/app/redux/store'

import type { QueryClient } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'

// TODO: This should be done by the auth server.
export async function clearStaleAuthBeforeLogin(
  queryClient: QueryClient,
  hostConfig: HostConfig | null
): Promise<void> {
  const localRobotName = getLocalRobot(store.getState())?.name ?? null
  if (hostConfig?.token == null || localRobotName == null) return

  try {
    const self = await fetchSelfQuery(queryClient, hostConfig)
    if (self.data.resetPassword) {
      store.dispatch(logOut({ robotName: localRobotName }))
    }
  } catch {
    // User will sign in through the modal.
  }
}
