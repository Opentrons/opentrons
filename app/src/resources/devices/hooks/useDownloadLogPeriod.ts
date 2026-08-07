import { useState } from 'react'
import { useDispatch, useStore } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import { downloadAuditLog, getLogPeriodDownloadStatus } from '/app/redux/audit'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import type { LogPeriodDetails, LogPeriodSummary } from '@opentrons/api-client'
import type { LogPeriodDownloadStatus } from '/app/redux/audit'
import type { Dispatch, State } from '/app/redux/types'

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
  const store = useStore<State>()

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
    dispatch(
      downloadAuditLog({
        logPeriodId: logPeriod.id,
        fileName: filename,
        hostname: host.hostname,
        port: host.port,
        destination: usbPath,
      })
    )
    return waitForStoreCondition<LogPeriodDownloadStatus>(
      store,
      state => getLogPeriodDownloadStatus(state, logPeriod.id),
      status =>
        status?.status === 'download-success' ||
        status?.status === 'download-failure'
    )
      .then(status => {
        if (status.status === 'download-failure') {
          onError?.(new Error(status.error))
          throw new Error(status.error)
        }
        if (status.status === 'download-success') {
          return status.deletionKey
        }
        return null
      })
      .finally(() => {
        setIsDownloading(false)
      })
  }
  return { downloadLogPeriod, isDownloading }
}
