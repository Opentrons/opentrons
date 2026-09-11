import { useQuery } from 'react-query'

import { getCalibrationPipetteOffset } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type {
  AllPipetteOffsetCalibrations,
  HostConfig,
} from '@opentrons/api-client'

export function useAllPipetteOffsetCalibrationsQuery(
  options: UseQueryOptions<AllPipetteOffsetCalibrations, Error> = {},
  hostOverride?: HostConfig | null
): UseQueryResult<AllPipetteOffsetCalibrations> {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost
  const query = useQuery(
    getQueryKey(host, 'calibration', 'pipette_offset'),
    () => getCalibrationPipetteOffset(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
