import * as React from 'react'

import type { AxiosRequestConfig } from 'axios'
import type { HostConfig, ResponsePromise } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export interface ApiHostProviderProps {
  hostname: string | null
  port?: number | null
  requestor?: <ResData>(config: AxiosRequestConfig) => ResponsePromise<ResData>
  robotName?: string | null
  token?: string
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const {
    hostname,
    port = null,
    requestor,
    robotName = null,
    token,
    children,
  } = props

  const hostConfig = React.useMemo<HostConfig | null>(
    () =>
      hostname !== null
        ? { hostname, port, requestor, robotName, token }
        : null,
    [hostname, port, requestor, robotName, token]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
