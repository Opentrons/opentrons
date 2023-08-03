import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { SubsystemUpdateProgressData } from './types'

export function updateSubsystem(
  config: HostConfig,
  subsystem: string
): ResponsePromise<SubsystemUpdateProgressData> {
  return request<SubsystemUpdateProgressData>(
    POST,
    `/subsystems/updates/${subsystem}`,
    null,
    config
  )
}
