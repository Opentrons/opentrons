import { useQuery } from 'react-query'

import { getPipetteSettings } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../api'

import type { UseQueryOptions, UseQueryResult } from 'react-query'
import type { PipetteSettings } from '@opentrons/api-client'

export type UsePipetteSettingsQueryOptions = UseQueryOptions<PipetteSettings>

export function usePipetteSettingsQuery(
  options: UsePipetteSettingsQueryOptions = {}
): UseQueryResult<PipetteSettings> {
  const host = useHost()
  const query = useQuery<PipetteSettings>(
    getQueryKey(host, 'pipettes', 'settings'),
    () => getPipetteSettings(host!).then(response => response.data),
    { enabled: host !== null, ...options }
  )

  return query
}
