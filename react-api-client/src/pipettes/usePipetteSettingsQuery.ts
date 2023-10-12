import { useQuery } from 'react-query'
import { getPipetteSettings } from '@opentrons/api-client'
import { useHost } from '../api'
import type { UseQueryResult, UseQueryOptions } from 'react-query'
import type { HostConfig, PipetteSettings } from '@opentrons/api-client'

export function usePipetteSettingsQuery(
  options: UseQueryOptions<PipetteSettings> = {}
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
