import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  CurrentSubsystemUpdates,
  SubsystemUpdateProgressData,
} from './types'
/**
 *
 * @param config
 * @param subsystem Subsystem
 * @returns CurrentSubsystemUpdates | SubsystemUpdateProgressData
 * If subsystem is specified, this hook returns SubsystemUpdateProgressData
 * If not, this hook returns CurrentSubsystemUpdates
 */
export function getCurrentSubsystemUpdates(
  config: HostConfig,
  subsystem: string | null
): ResponsePromise<CurrentSubsystemUpdates | SubsystemUpdateProgressData> {
  return request<CurrentSubsystemUpdates | SubsystemUpdateProgressData>(
    GET,
    `/subsystems/updates/current/${subsystem}`,
    null,
    config
  )
}
