import * as React from 'react'
import { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export interface ApiHostProviderProps {
  hostname: string
  port?: number | null
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const { hostname, port = null, children } = props
  const hostConfig = React.useMemo<HostConfig>(() => ({ hostname, port }), [
    hostname,
    port,
  ])

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
