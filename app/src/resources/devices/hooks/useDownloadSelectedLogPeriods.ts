import { useMutation } from 'react-query'
import { useDispatch } from 'react-redux'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import {
  getLogPeriodRaw,
  LOG_PERIOD_DELETION_KEY_HEADER,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { logPeriodDeletionKeyReceived } from '/app/redux/audit'
import { saveFileToUsb } from '/app/redux/shell/remote'

import type { UseMutationResult } from 'react-query'
import type { LogPeriodSummary } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

export interface DownloadedLogPeriod {
  logPeriod: LogPeriodSummary
  // the deletion key from the download response, or null if the server
  // didn't return one for this logPeriod; callers that chain a delete after
  // download must check this rather than assuming redux has it
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

  const downloadLogPeriods = async ({
    logPeriods,
    callTimeUsbPath,
  }: DownloadLogPeriodsVariables): Promise<readonly DownloadedLogPeriod[]> => {
    const currentHost = host
    if (currentHost == null || logPeriods.length === 0) {
      throw new Error('Unable to download: no host, or nothing selected.')
    }

    const zip = new JSZip()

    const results = await Promise.allSettled(
      logPeriods.map(async logPeriod => {
        const logPeriodDateTransformed = logPeriod.startedAt.replaceAll(
          ':',
          '_'
        )

        const res = await getLogPeriodRaw(currentHost, logPeriod.id, 'blob')

        // the server hands back a one-time deletion key when a log period is
        // downloaded; stash it in redux for other consumers, and also
        // resolve with it directly so a chained delete can enforce its
        // presence off this call's own result instead of a redux selector
        // snapshot that may not have caught up yet
        const deletionKeyHeader = res.headers?.[LOG_PERIOD_DELETION_KEY_HEADER]
        const deletionKey =
          typeof deletionKeyHeader === 'string' ? deletionKeyHeader : null
        if (deletionKey != null) {
          dispatch(
            logPeriodDeletionKeyReceived({
              logPeriodId: logPeriod.id,
              deletionKey,
            })
          )
        }

        const buf = await res.data.arrayBuffer()
        zip.file(`logperiod_${logPeriodDateTransformed}.zip`, buf)

        return { logPeriod, deletionKey }
      })
    )

    const successfulDownloads: DownloadedLogPeriod[] = []

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulDownloads.push(result.value)
      }
    })

    // If every single logPeriod failed, abort early without generating an empty zip file
    if (successfulDownloads.length === 0) {
      throw new Error('Failed to download any of the selected log periods.')
    }

    const buffer = await zip.generateAsync({ type: 'arraybuffer' })
    const filename = `${robotName}-log-periods.zip`

    if (callTimeUsbPath != null) {
      await saveFileToUsb(`${callTimeUsbPath}/${filename}`, buffer)
    } else {
      saveAs(new Blob([buffer]), filename)
    }

    return successfulDownloads
  }

  // Downloading log periods doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  return useMutation(downloadLogPeriods)
}
