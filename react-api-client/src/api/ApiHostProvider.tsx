import { HostConfig } from '@opentrons/api-client'
import * as React from 'react'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export interface ApiHostProviderProps {
  hostname: string | null
  port?: number | null
  robotName?: string | null
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const { hostname, port = null, robotName = null, children } = props
  const hostConfig = React.useMemo<HostConfig | null>(
    () => (hostname !== null ? { hostname, port, robotName } : null),
    [hostname, port, robotName]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
