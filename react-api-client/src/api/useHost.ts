import { HostConfig } from '@opentrons/api-client'
import { useContext } from 'react'

import { ApiHostContext } from './ApiHostProvider'

export function useHost(): HostConfig | null {
  return useContext(ApiHostContext)
}
