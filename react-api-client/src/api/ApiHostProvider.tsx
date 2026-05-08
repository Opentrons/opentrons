import * as React from 'react'

import type { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = React.createContext<HostConfig | null>(null)

export type ApiHostProviderProps = React.PropsWithChildren<HostConfig>

export function ApiHostProvider(props: ApiHostProviderProps): JSX.Element {
  // We want to create a HostConfig object straight from our props, just passing them
  // straight through. Spiritually, we are doing `{children, ...hostConfig} = props`.
  // But for memoization reasons, we destructure all the props individually.
  const {
    children,
    hostname,
    port,
    secure,
    requestor,
    robotName,
    token,
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
