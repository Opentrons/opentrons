import { getCalibrationTipLength } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import type {
  HostConfig,
  AllTipLengthCalibrations,
} from '@opentrons/api-client'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useAllTipLengthCalibrationsQuery(
  options: UseQueryOptions<
    AllTipLengthCalibrations,
    Error,
    AllTipLengthCalibrations,
    Array<string | HostConfig>
  > = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AllTipLengthCalibrations> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    [host as HostConfig, 'calibration', 'tip_length'],
    () =>
      getCalibrationTipLength(host as HostConfig).then(
        response => response.data
      ),
    { enabled: host !== null, ...options }
  )

  return query
}
