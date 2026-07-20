import { useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import { getRunRaw } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { saveFileToUsb } from '/app/redux/shell/remote'

import type { RunData } from '@opentrons/api-client'

interface UseDownloadSelectedRunsResult {
  downloadRuns: (
    runs: readonly RunData[],
    callTimeUsbPath?: string
  ) => Promise<void>
  isDownloading: boolean
  hasError: boolean
}

export function useDownloadSelectedRuns(
  robotName: string,
  usbPath?: string
): UseDownloadSelectedRunsResult {
  const host = useHost()
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const downloadRuns = (
    runs: readonly RunData[],
    callTimeUsbPath?: string
  ): Promise<void> => {
    const currentHost = host
    if (currentHost == null || runs.length === 0 || isDownloading) {
      return Promise.resolve()
    }

    setIsDownloading(true)
    setHasError(false)

    const effectiveUsbPath = callTimeUsbPath ?? usbPath
    const zip = new JSZip()
    return Promise.all(
      runs.map(run =>
        getRunRaw(currentHost, run.id, 'blob').then(res => {
          zip.file(`${run.id}.json`, res.data)
        })
      )
    )
      .then(() => zip.generateAsync({ type: 'arraybuffer' }))
      .then(async buffer => {
        const filename = `${robotName}-run-records.zip`
        if (effectiveUsbPath != null) {
          await saveFileToUsb(`${effectiveUsbPath}/${filename}`, buffer)
        } else {
          saveAs(new Blob([buffer]), filename)
        }
      })
      .then(() => {
        setIsDownloading(false)
      })
      .catch(() => {
        setHasError(true)
        setIsDownloading(false)
      })
  }

  return { downloadRuns, isDownloading, hasError }
}
