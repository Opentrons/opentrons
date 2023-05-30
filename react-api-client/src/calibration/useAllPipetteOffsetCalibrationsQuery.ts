import { getCalibrationPipetteOffset } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import { useHost } from '../api'
import type {
  HostConfig,
  AllPipetteOffsetCalibrations,
} from '@opentrons/api-client'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

export function useAllPipetteOffsetCalibrationsQuery(
  options: UseQueryOptions<
    AllPipetteOffsetCalibrations,
    Error,
    AllPipetteOffsetCalibrations,
    Array<string | HostConfig>
  > = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AllPipetteOffsetCalibrations> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    [host as HostConfig, 'calibration', 'pipette_offset'],
    () =>
      getCalibrationPipetteOffset(host as HostConfig).then(
        response => response.data
      ),
    { enabled: host !== null, ...options }
  )

  return query
}
