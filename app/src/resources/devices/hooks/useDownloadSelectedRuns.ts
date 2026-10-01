import { useMutation } from 'react-query'
import { useSelector } from 'react-redux'

import { DEFAULT_RUN_DOWNLOAD_PARAMS } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { getIncludeProtocolSourceInRunDownload } from '/app/redux/config'
import { saveLogs } from '/app/redux/shell/remote'

import type { UseMutationResult } from 'react-query'
import type { GetRunDownloadParams, RunData } from '@opentrons/api-client'

export interface DownloadRunsVariables {
  runs: readonly RunData[]
  destination?: string
}

function buildRunDownloadSource(
  runId: string,
  params: Required<GetRunDownloadParams>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  return `/runs/${runId}/download?${search.toString()}`
}

export function useDownloadSelectedRuns(
  robotName: string
): UseMutationResult<readonly RunData[], unknown, DownloadRunsVariables> {
  const host = useHost()
  const includeProtocolSource = useSelector(
    getIncludeProtocolSourceInRunDownload
  )
  const { data: protocols } = useAllProtocolsQuery()

  const downloadRuns = async ({
    runs,
    destination,
  }: DownloadRunsVariables): Promise<readonly RunData[]> => {
    const currentHost = host
    if (currentHost == null || runs.length === 0) {
      throw new Error('Unable to download: no host, or nothing selected.')
    }

    const params = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: includeProtocolSource,
    }

    const pathEntries = runs.map(run => {
      const matchingProtocol = protocols?.data.find(
        ({ id: protocolId }) => run.protocolId === protocolId
      )
      const matchingProtocolName = matchingProtocol?.metadata.protocolName
      const runDateTransformed = run.createdAt.replaceAll(':', '_')
      return {
        run,
        path: buildRunDownloadSource(run.id, params),
        name: `${matchingProtocolName ?? run.id}_${runDateTransformed}.zip`,
      }
    })

    const { succeededPaths } = await saveLogs({
      name: `${robotName}-run-records.zip`,
      paths: pathEntries.map(({ path, name }) => ({ path, name })),
      hostname: currentHost.hostname,
      port: currentHost.port ?? null,
      destination,
    })

    const succeededPathSet = new Set(succeededPaths)
    const successfulRuns = pathEntries
      .filter(({ path }) => succeededPathSet.has(path))
      .map(({ run }) => run)

    if (successfulRuns.length === 0) {
      throw new Error('Failed to download any of the selected run records.')
    }

    return successfulRuns
  }

  // Downloading runs doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  return useMutation(downloadRuns)
}
