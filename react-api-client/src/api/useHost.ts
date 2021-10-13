import { useContext } from 'react'
import { HostConfig } from '@opentrons/js-api-client'
import { ApiHostContext } from './ApiHostProvider'

export function useHost(): HostConfig | null {
  return useContext(ApiHostContext)
}
