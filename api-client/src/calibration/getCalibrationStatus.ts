import { GET, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { CalibrationStatus } from './types'

export function getCalibrationStatus(
  config: HostConfig
): ResponsePromise<CalibrationStatus> {
  return request<CalibrationStatus>(GET, '/calibration/status', null, config)
}
