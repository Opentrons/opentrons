import * as React from 'react'

import type { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export type ApiHostProviderProps = Omit<HostConfig, 'hostname'> & {
  hostname: HostConfig['hostname'] | null
} & {
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const { hostname, port, secure, requestor, robotName, token, children } =
    props

  const hostConfig = React.useMemo<HostConfig | null>(
    () =>
      hostname !== null
        ? { hostname, port, secure, requestor, robotName, token }
        : null,
    [hostname, port, secure, requestor, robotName, token]
  )

  return (
    <ApiHostContext.Provider value={hostConfig}>
      {children}
    </ApiHostContext.Provider>
  )
}
