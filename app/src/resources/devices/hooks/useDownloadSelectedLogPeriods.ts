import { useMutation } from 'react-query'
import { useDispatch, useStore } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { downloadAuditLogs, getLogPeriodDownloadStatus } from '/app/redux/audit'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import type { UseMutationResult } from 'react-query'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { LogPeriodDownloadStatus } from '/app/redux/audit'
import type { Dispatch, State } from '/app/redux/types'

export interface DownloadedLogPeriod {
  logPeriod: LogPeriodSummary
  // the deletion key from a successful download, or null if the download
  // failed; callers that chain a delete after download must check this
  deletionKey: string | null
}

export interface DownloadLogPeriodsVariables {
  logPeriods: readonly LogPeriodSummary[]
  callTimeUsbPath?: string
}

export function useDownloadSelectedLogPeriods(
  robotName: string
): UseMutationResult<
  readonly DownloadedLogPeriod[],
  unknown,
  DownloadLogPeriodsVariables
> {
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const store = useStore<State>()

  const downloadLogPeriods = async ({
    logPeriods,
    callTimeUsbPath,
  }: DownloadLogPeriodsVariables): Promise<readonly DownloadedLogPeriod[]> => {
    if (host == null || logPeriods.length === 0) {
      throw new Error('Unable to download: no host, or nothing selected.')
    }

    dispatch(
      downloadAuditLogs({
        logPeriodSummaries: [...logPeriods],
        hostname: host.hostname,
        port: host.port,
        robotName,
        destination: callTimeUsbPath,
      })
    )

    const results = await Promise.all(
      logPeriods.map(async logPeriod => {
        const status = await waitForStoreCondition<LogPeriodDownloadStatus>(
          store,
          state => getLogPeriodDownloadStatus(state, logPeriod.id),
          downloadStatus =>
            downloadStatus.status === 'download-success' ||
            downloadStatus.status === 'download-failure'
        )
        return { logPeriod, status }
      })
    )

    const successfulDownloads: DownloadedLogPeriod[] = results.flatMap(
      ({ logPeriod, status }) =>
        status.status === 'download-success'
          ? [{ logPeriod, deletionKey: status.deletionKey }]
          : []
    )

    // If every single logPeriod failed, abort so callers can surface an error
    if (successfulDownloads.length === 0) {
      throw new Error('Failed to download any of the selected log periods.')
    }

    return successfulDownloads
  }

  // Downloading log periods doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  return useMutation(downloadLogPeriods)
}
