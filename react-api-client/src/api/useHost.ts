import { createContext, useContext } from 'react'

import type { HostConfig } from '@opentrons/api-client'

export const ApiHostContext = createContext<HostConfig | null>(null)

export function useHost(): HostConfig | null {
  return useContext(ApiHostContext)
}
