import { useMemo } from 'react'

import { useRunLoadedLabwareDefinitions } from '@opentrons/react-api-client'
import { getLabwareDefURI } from '@opentrons/shared-data'

import type { AxiosError } from 'axios'
import type { UseQueryOptions } from 'react-query'
import type {
  HostConfig,
  RunLoadedLabwareDefinitions,
} from '@opentrons/api-client'
import type { LabwareDefinition } from '@opentrons/shared-data'

export type RunLoadedLabwareDefinitionsByUri = Record<string, LabwareDefinition>

// Returns a record of labware definitions keyed by URI for the labware that
// has been loaded with a "loadLabware" command. Errors if the run is not the current run.
// Returns null if the network request is pending.
export function useRunLoadedLabwareDefinitionsByUri(
  runId: string | null,
  options: UseQueryOptions<RunLoadedLabwareDefinitions, AxiosError> = {},
  hostOverride?: HostConfig
): RunLoadedLabwareDefinitionsByUri | null {
  const { data } = useRunLoadedLabwareDefinitions(runId, options, hostOverride)

  return useMemo(() => {
    const result: Record<string, LabwareDefinition> = {}

    if (data == null) {
      return null
    } else {
      data.data.forEach((def: LabwareDefinition) => {
        const lwUri = getLabwareDefURI(def)
        result[lwUri] = def
      })

      return result
    }
  }, [data])
}
