import { useContext } from 'react'
import { ApiHostContext } from './ApiHostProvider'
import type { HostConfig } from '@opentrons/api-client'

export function useHost(): HostConfig | null {
  return useContext(ApiHostContext)
}
