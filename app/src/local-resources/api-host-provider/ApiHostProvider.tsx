import { useMemo } from 'react'

import { ApiHostContext } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { OPENTRONS_USB } from '/app/redux/discovery/constants'
import { useAccessTokenForRobot } from '/app/redux/robot-auth/hooks'
import { appShellUSBRequestor } from '/app/redux/shell/remote'

import type { AxiosRequestConfig } from 'axios'
import type { ReactNode } from 'react'
import type { HostConfig, ResponsePromise } from '@opentrons/api-client'

export interface ApiHostProviderProps {
  robotName: string | null
  children: ReactNode
  requestor?: <ResData>(config: AxiosRequestConfig) => ResponsePromise<ResData>
}

export function ApiHostProvider({
  robotName,
  children,
  requestor,
}: ApiHostProviderProps): ReactNode {
  const robot = useRobot(robotName)
  const token = useAccessTokenForRobot(robotName)

  const requestorToUse = useMemo(() => {
    return (
      requestor ??
      (robot?.ip === OPENTRONS_USB ? appShellUSBRequestor : undefined)
    )
  }, [robot?.ip, requestor])

  const hostConfig = useMemo<HostConfig | null>(
    () =>
      robotName !== null && robot?.ip != null
        ? {
            hostname: robot.ip,
            port: robot.port,
            requestor: requestorToUse,
            token,
            robotName,
          }
        : null,
    [requestorToUse, robot?.ip, robot?.port, robotName, token]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
