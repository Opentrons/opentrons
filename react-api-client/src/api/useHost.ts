import { ApiHostContext } from './ApiHostProvider'
import { HostConfig } from '@opentrons/api-client'
import { useContext } from 'react'

export function useHost(): HostConfig | null {
  return useContext(ApiHostContext)
}
