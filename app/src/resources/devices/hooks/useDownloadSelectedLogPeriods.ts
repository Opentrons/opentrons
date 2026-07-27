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

interface UseDownloadSelectedLogPeriodsResult {
  downloadLogPeriods: (
    LogPeriods: readonly LogPeriodSummary[],
    callTimeUsbPath?: string
  ) => Promise<void>
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

  const downloadLogPeriods = (
    logPeriods: readonly LogPeriodSummary[],
    callTimeUsbPath?: string
  ): Promise<void> => {
    const currentHost = host
    if (currentHost == null || logPeriods.length === 0 || isDownloading) {
      return Promise.reject(
        new Error(
          'Unable to download: no host, nothing selected, or a download is already in progress.'
        )
      )
    }

    setIsDownloading(true)
    setHasError(false)

    const zip = new JSZip()
    return Promise.all(
      logPeriods.map(logPeriod => {
        const logPeriodDateTransformed = logPeriod.startedAt.replaceAll(
          ':',
          '_'
        )
        return getLogPeriodRaw(currentHost, logPeriod.id, 'blob').then(
          async res => {
            // the server hands back a one-time deletion key when a log period
            // is downloaded; stash it in redux so a later delete can use it
            const deletionKey = res.headers?.[LOG_PERIOD_DELETION_KEY_HEADER]
            if (typeof deletionKey === 'string') {
              dispatch(
                logPeriodDeletionKeyReceived({
                  logPeriodId: logPeriod.id,
                  deletionKey,
                })
              )
            }
            const buf = await (res.data as Blob).arrayBuffer()
            zip.file(`logperiod_${logPeriodDateTransformed}.zip`, buf)
          }
        )
      })
    )
      .then(() => zip.generateAsync({ type: 'arraybuffer' }))
      .then(async buffer => {
        const filename = `${robotName}-log-periods.zip`
        if (callTimeUsbPath != null) {
          await saveFileToUsb(`${callTimeUsbPath}/${filename}`, buffer)
        } else {
          saveAs(new Blob([buffer]), filename)
        }
      })
      .then(() => {
        setIsDownloading(false)
      })
      .catch((e: Error) => {
        setHasError(true)
        setIsDownloading(false)
        throw e
      })
  }

  return { downloadLogPeriods, isDownloading, hasError }
}
