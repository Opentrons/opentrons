import { getCalibrationStatus } from '@opentrons/api-client'
import type { CalibrationStatus, HostConfig } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export function useCalibrationStatusQuery(
  options: UseQueryOptions<
    CalibrationStatus,
    Error,
    CalibrationStatus,
    Array<string | HostConfig>
  > = {},
  hostOverride?: HostConfig | null
): UseQueryResult<CalibrationStatus> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    [host as HostConfig, 'calibration', 'status'],
    () =>
      getCalibrationStatus(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
