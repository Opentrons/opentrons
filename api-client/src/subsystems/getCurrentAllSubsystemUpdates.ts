import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CurrentSubsystemUpdates } from './types'

/**
 *
 * @param config
 * @returns CurrentSubsystemUpdates
 */
export function getCurrentAllSubsystemUpdates(
  config: HostConfig
): ResponsePromise<CurrentSubsystemUpdates> {
  return request<CurrentSubsystemUpdates>(
    GET,
    '/subsystems/updates/current',
    null,
    config
  )
}
