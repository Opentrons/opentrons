import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { SubsystemUpdateProgressData, Subsystem } from './types'

/**
 *
 * @param config
 * @param subsystem Subsystem
 * @returns SubsystemUpdateProgressData
 */
export function getCurrentSubsystemUpdate(
  config: HostConfig,
  subsystem: Subsystem
): ResponsePromise<SubsystemUpdateProgressData> {
  return request<SubsystemUpdateProgressData>(
    GET,
    `/subsystems/updates/current/${subsystem}`,
    null,
    config
  )
}
