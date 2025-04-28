import { getPipetteSettings } from '@opentrons/api-client'
import type { HostConfig, PipetteSettings } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryOptions, UseQueryResult } from 'react-query'
import { useHost } from '../api'

export type UsePipetteSettingsQueryOptions = UseQueryOptions<PipetteSettings>

export function usePipetteSettingsQuery(
  options: UsePipetteSettingsQueryOptions = {}
): UseQueryResult<PipetteSettings> {
  const host = useHost()
  const query = useQuery<PipetteSettings>(
    [host, 'pipettes', 'settings'],
    () =>
      getPipetteSettings(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
