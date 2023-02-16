import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { AllPipetteOffsetCalibrations } from './types'

export function getCalibrationPipetteOffset(
  config: HostConfig
): ResponsePromise<AllPipetteOffsetCalibrations> {
  return request<AllPipetteOffsetCalibrations>(
    GET,
    '/calibration/pipette_offset',
    null,
    config
  )
}
