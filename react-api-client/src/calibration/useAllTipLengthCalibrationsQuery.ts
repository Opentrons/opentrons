import { useQuery } from 'react-query'

import { getCalibrationTipLength } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AllTipLengthCalibrations,
  HostConfig,
} from '@opentrons/api-client'

export function useAllTipLengthCalibrationsQuery(
  options: UseQueryOptions<AllTipLengthCalibrations, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AllTipLengthCalibrations> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    getQueryKey(host, 'calibration', 'tip_length'),
    () => getCalibrationTipLength(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
