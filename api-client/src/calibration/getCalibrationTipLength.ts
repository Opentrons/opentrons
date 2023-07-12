import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { AllTipLengthCalibrations } from './types'

export function getCalibrationTipLength(
  config: HostConfig
): ResponsePromise<AllTipLengthCalibrations> {
  return request<AllTipLengthCalibrations>(
    GET,
    '/calibration/tip_length',
    null,
    config
  )
}
