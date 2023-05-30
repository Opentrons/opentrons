import { DELETE, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig, EmptyResponse } from '../types'
import type { DeleteCalRequestParams } from './types'

export function deleteCalibration(
  config: HostConfig,
  params: DeleteCalRequestParams
): ResponsePromise<EmptyResponse> {
  const { calType, ...apiParams } = params
  const endpoint =
    params.calType === 'pipetteOffset' ? 'pipette_offset' : 'tip_length'
  return request<EmptyResponse>(
    DELETE,
    `/calibration/${endpoint}`,
    null,
    config,
    apiParams
  )
}
