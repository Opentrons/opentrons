import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { SubsystemUpdateProgressData } from './types'

export function getSubsystemUpdate(
  config: HostConfig,
  updateId: string
): ResponsePromise<SubsystemUpdateProgressData> {
  return request<SubsystemUpdateProgressData>(
    GET,
    `/subsystems/updates/all/${updateId}`,
    null,
    config
  )
}
