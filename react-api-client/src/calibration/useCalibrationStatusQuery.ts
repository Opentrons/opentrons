import { useQuery } from 'react-query'

import { getCalibrationStatus } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { CalibrationStatus, HostConfig } from '@opentrons/api-client'

export function useCalibrationStatusQuery(
  options: UseQueryOptions<CalibrationStatus, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<CalibrationStatus> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    getQueryKey(host, 'calibration', 'status'),
    () => getCalibrationStatus(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
