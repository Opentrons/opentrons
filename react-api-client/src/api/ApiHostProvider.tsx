import * as React from 'react'
import { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export interface ApiHostProviderProps {
  hostname: string | null
  port?: number | null
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const { hostname, port = null, children } = props
  const hostConfig = React.useMemo<HostConfig | null>(
    () => (hostname !== null ? { hostname, port } : null),
    [hostname, port]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
