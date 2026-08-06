import { useState } from 'react'
import { useDispatch, useStore } from 'react-redux'

import { useHost } from '@opentrons/react-api-client'

import {
  downloadAuditLog,
  getLogPeriodDownloadDeleteStatus,
} from '/app/redux/audit'
import { waitForStoreCondition } from '/app/redux/waitForStoreCondition'

import type { LogPeriodSummary } from '@opentrons/api-client'
import type { LogPeriodDownloadDeleteStatus } from '/app/redux/audit'
import type { Dispatch, State } from '/app/redux/types'

export function useDownloadLogPeriod(
  logPeriod: LogPeriodSummary,
  onError?: (error: Error) => void
): {
  downloadLogPeriod: (usbPath?: string) => Promise<void>
  isDownloading: boolean
} {
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const [isDownloading, setIsDownloading] = useState(false)
  const store = useStore<State>()

  const logPeriodStartDateTransformed = logPeriod.startedAt.replaceAll(':', '_')

  const downloadLogPeriod = (usbPath?: string): Promise<void> => {
    if (host == null) {
      return Promise.resolve()
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
    return waitForStoreCondition<LogPeriodDownloadDeleteStatus>(
      store,
      state => getLogPeriodDownloadDeleteStatus(state, logPeriod.id),
      status =>
        status?.status === 'download-success' ||
        status?.status === 'download-failure'
    )
      .then(status => {
        if (status.status === 'download-failure') {
          onError?.(new Error(status.error))
          throw new Error(status.error)
        }
      })
      .finally(() => {
        setIsDownloading(false)
      })
  }
  return { downloadLogPeriod, isDownloading }
}
