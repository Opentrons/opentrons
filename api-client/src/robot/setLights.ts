import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { Lights, SetLightsData } from './types'

export function setLights(
  config: HostConfig,
  data: SetLightsData
): ResponsePromise<Lights> {
  return request<Lights, SetLightsData>(POST, '/robot/lights', data, config)
}
