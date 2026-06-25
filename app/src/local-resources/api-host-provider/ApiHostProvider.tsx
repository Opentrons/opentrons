import { useMemo } from 'react'

import { ApiHostContext } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots/hooks/useRobot'
import { OPENTRONS_USB } from '/app/redux/discovery/constants'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import type { ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

export interface ApiHostProviderProps {
  robotName: string | null
  children: ReactNode
}

export function ApiHostProvider({
  robotName,
  children,
}: ApiHostProviderProps): JSX.Element {
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  const hostConfig = useMemo<HostConfig | null>(
    () =>
      robotName !== null && robot?.ip != null
        ? {
            hostname: robot.ip,
            port: robot.port,
            requestor:
              robot.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined,
            robotName,
            token,
          }
        : null,
    [robot?.ip, robot?.port, robotName, token]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
