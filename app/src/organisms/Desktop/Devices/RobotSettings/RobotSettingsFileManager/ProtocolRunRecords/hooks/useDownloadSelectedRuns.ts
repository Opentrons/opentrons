import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import { getRunRaw } from '@opentrons/api-client'
import { ERROR_TOAST, INFO_TOAST } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { useToaster } from '/app/organisms/ToasterOven'

import type { RunData } from '@opentrons/api-client'
import type { IconProps } from '@opentrons/components'

interface UseDownloadSelectedRunsResult {
  downloadSelectedRuns: (runs: RunData[]) => void
  isDownloading: boolean
}

export function useDownloadSelectedRuns(
  robotName: string
): UseDownloadSelectedRunsResult {
  const { t } = useTranslation('device_details')
  const host = useHost()
  const { makeToast, eatToast } = useToaster()
  const [isDownloading, setIsDownloading] = useState(false)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const downloadSelectedRuns = (runs: RunData[]): void => {
    if (host == null || runs.length === 0 || isDownloading) {
      return
    }

    setIsDownloading(true)
    const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
    const toastId = makeToast(
      t('downloading_run_records') as string,
      INFO_TOAST,
      { disableTimeout: true, icon: toastIcon }
    )

    const zip = new JSZip()
    Promise.all(
      runs.map(run =>
        getRunRaw(host, run.id, 'blob')
          .then(res => {
            zip.file(`${run.id}.json`, res.data)
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
            saveAs(blob, `${robotName}-run-records.zip`)
          })
          .catch((e: Error) => {
            eatToast(toastId)
            makeToast(e.message, ERROR_TOAST, { closeButton: true })
            if (isMounted.current) setIsDownloading(false)
          })
      )
      .then(() => {
        eatToast(toastId)
        if (isMounted.current) setIsDownloading(false)
      })
      .catch((e: Error) => {
        eatToast(toastId)
        makeToast(e.message, ERROR_TOAST, { closeButton: true })
        if (isMounted.current) setIsDownloading(false)
      })
  }

  return { downloadSelectedRuns, isDownloading }
}
