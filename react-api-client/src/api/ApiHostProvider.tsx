import * as React from 'react'

import type { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export type ApiHostProviderProps = Omit<HostConfig, 'hostname'> & {
  hostname: HostConfig['hostname'] | null
} & {
  children?: React.ReactNode
}

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  const {
    hostname,
    port,
    secure,
    requestor,
    robotName,
    token,
    children,
    ...rest
  } = props
  assertEmpty(rest) // Make sure we didn't forget to destructure anything.

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

/** Cause a type-checking error if anything other than an empty object ({}) is passed. */
function assertEmpty(object: Record<string, never>): void {}
