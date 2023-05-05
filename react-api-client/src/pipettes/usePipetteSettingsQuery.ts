import { getPipetteSettings } from '@opentrons/api-client'
import type { HostConfig, PipetteSettings } from '@opentrons/api-client'
import { useQuery } from 'react-query'
import type { UseQueryResult, UseQueryOptions } from 'react-query'

import { useHost } from '../api'

export function usePipetteSettingsQuery(
  options: UseQueryOptions<PipetteSettings> = {}
): UseQueryResult<PipetteSettings> {
  const host = useHost()
  const query = useQuery<PipetteSettings>(
    [host, 'pipettesSettings'],
    () =>
      getPipetteSettings(host as HostConfig).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
