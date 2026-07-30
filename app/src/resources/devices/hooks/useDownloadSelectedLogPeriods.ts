import { useState } from 'react'
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

import type { LogPeriodSummary } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

export interface DownloadedLogPeriod {
  logPeriod: LogPeriodSummary
  // the deletion key from the download response, or null if the server
  // didn't return one for this logPeriod; callers that chain a delete after
  // download must check this rather than assuming redux has it
  deletionKey: string | null
}

interface UseDownloadSelectedLogPeriodsResult {
  downloadLogPeriods: (
    logPeriods: readonly LogPeriodSummary[],
    callTimeUsbPath?: string
  ) => Promise<readonly DownloadedLogPeriod[]>
  isDownloading: boolean
  hasError: boolean
}

export function useDownloadSelectedLogPeriods(
  robotName: string
): UseDownloadSelectedLogPeriodsResult {
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const downloadLogPeriods = async (
    logPeriods: readonly LogPeriodSummary[],
    callTimeUsbPath?: string
  ): Promise<readonly DownloadedLogPeriod[]> => {
    const currentHost = host
    if (currentHost == null || logPeriods.length === 0 || isDownloading) {
      throw new Error(
        'Unable to download: no host, nothing selected, or a download is already in progress.'
      )
    }

    setIsDownloading(true)
    setHasError(false)

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

        const buf = await (res.data as Blob).arrayBuffer()
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
      setHasError(true)
      setIsDownloading(false)
      throw new Error('Failed to download any of the selected log periods.')
    }

    try {
      const buffer = await zip.generateAsync({ type: 'arraybuffer' })
      const filename = `${robotName}-log-periods.zip`

      if (callTimeUsbPath != null) {
        await saveFileToUsb(`${callTimeUsbPath}/${filename}`, buffer)
      } else {
        saveAs(new Blob([buffer]), filename)
      }

      setIsDownloading(false)
      return successfulDownloads
    } catch (e) {
      setHasError(true)
      setIsDownloading(false)
      throw e
    }
  }

  return { downloadLogPeriods, isDownloading, hasError }
}
