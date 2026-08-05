import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { saveAs } from 'file-saver'

import {
  getLogPeriodRaw,
  LOG_PERIOD_DELETION_KEY_HEADER,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { logPeriodDeletionKeyReceived } from '/app/redux/audit'
import { saveFileToUsb } from '/app/redux/shell/remote'

import type { LogPeriodDetails, LogPeriodSummary } from '@opentrons/api-client'
import type { Dispatch } from '/app/redux/types'

export function useDownloadLogPeriod(
  logPeriod: LogPeriodSummary | LogPeriodDetails | undefined,
  onError?: (error: Error) => void
): {
  downloadLogPeriod: (usbPath?: string) => Promise<string | null>
  isDownloading: boolean
} {
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const [isDownloading, setIsDownloading] = useState(false)

  const logPeriodStartDateTransformed = logPeriod?.startedAt.replaceAll(
    ':',
    '_'
  )

  const downloadLogPeriod = (usbPath?: string): Promise<string | null> => {
    if (host == null || logPeriod == null) {
      return Promise.resolve(null)
    }
    setIsDownloading(true)
    const filename = `logperiod_${logPeriodStartDateTransformed}.zip`
    return getLogPeriodRaw(host, logPeriod.id, 'blob')
      .then(async res => {
        // the server hands back a one-time deletion key when a log period is
        // downloaded; stash it in redux so a later delete can use it
        const deletionKey = res.headers?.[LOG_PERIOD_DELETION_KEY_HEADER]
        if (typeof deletionKey === 'string') {
          dispatch(
            logPeriodDeletionKeyReceived({
              logPeriodId: logPeriod.id,
              deletionKey,
            })
          )
        }
        if (usbPath != null) {
          const buffer = await (res.data as Blob).arrayBuffer()
          await saveFileToUsb(`${usbPath}/${filename}`, buffer)
        } else {
          saveAs(res.data as Blob, filename)
        }
        setIsDownloading(false)
        return deletionKey
      })
      .catch((e: Error) => {
        setIsDownloading(false)
        onError?.(e)
        throw e
      })
  }

  return { downloadLogPeriod, isDownloading }
}
