import { useQuery } from 'react-query'
import { getPipetteSettings } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, PipetteSettings } from '@opentrons/api-client'

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
