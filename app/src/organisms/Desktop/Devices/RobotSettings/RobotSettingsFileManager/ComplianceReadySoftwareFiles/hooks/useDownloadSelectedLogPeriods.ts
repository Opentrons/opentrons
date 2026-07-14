import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import {
  getLogPeriodRaw,
  LOG_PERIOD_DELETION_KEY_HEADER,
} from '@opentrons/api-client'
import { ERROR_TOAST, INFO_TOAST } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'
import { logPeriodDeletionKeyReceived } from '/app/redux/audit'

import type { LogPeriodSummary } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'
import type { Dispatch } from '/app/redux/types'

interface UseDownloadSelectedLogPeriodsResult {
  downloadSelectedLogPeriods: (periods: LogPeriodSummary[]) => void
  isDownloading: boolean
}

export function useDownloadSelectedLogPeriods(
  robotName: string
): UseDownloadSelectedLogPeriodsResult {
  const { t } = useTranslation('device_details')
  const host = useHost()
  const dispatch = useDispatch<Dispatch>()
  const { makeToast, eatToast } = useToaster()
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadSelectedLogPeriods = (periods: LogPeriodSummary[]): void => {
    if (host == null || periods.length === 0 || isDownloading) {
      return
    }

    setIsDownloading(true)
    const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
    const toastId = makeToast(t('downloading_logs') as string, INFO_TOAST, {
      disableTimeout: true,
      icon: toastIcon,
    })

    const zip = new JSZip()
    Promise.all(
      periods.map(period =>
        getLogPeriodRaw(host, period.id, 'blob')
          .then(res => {
            zip.file(`${period.id}.log`, res.data)
            const deletionKey = res.headers?.[LOG_PERIOD_DELETION_KEY_HEADER]
            // ensure the deletionKey exists on the header
            if (typeof deletionKey === 'string') {
              // store the log period deletion key in Redux state
              dispatch(
                logPeriodDeletionKeyReceived({
                  logPeriodId: period.id,
                  deletionKey,
                })
              )
            }
          })
          .catch((e: Error) =>
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
          )
      )
    )
      .then(() =>
        zip
          .generateAsync({ type: 'blob' })
          .then(blob => {
            saveAs(blob, `${robotName}-compliance-logs.zip`)
          })
          .catch((e: Error) => {
            eatToast(toastId)
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
            setIsDownloading(false)
          })
      )
      .then(() => {
        eatToast(toastId)
        setIsDownloading(false)
      })
      .catch((e: Error) => {
        eatToast(toastId)
        makeToast(e.message, ERROR_TOAST, { closeButton: true })
        setIsDownloading(false)
      })
  }

  return { downloadSelectedLogPeriods, isDownloading }
}
