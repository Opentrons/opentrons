import { useState } from 'react'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import { getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { saveFileToUsb } from '/app/redux/shell/remote'

import type { RunData } from '@opentrons/api-client'

interface UseDownloadSelectedRunsResult {
  downloadRuns: (
    runs: readonly RunData[],
    callTimeUsbPath?: string
  ) => Promise<readonly RunData[]>
  isDownloading: boolean
  hasError: boolean
}

export function useDownloadSelectedRuns(
  robotName: string
): UseDownloadSelectedRunsResult {
  const host = useHost()
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const { data: protocols } = useAllProtocolsQuery()

  const downloadRuns = async (
    runs: readonly RunData[],
    callTimeUsbPath?: string
  ): Promise<readonly RunData[]> => {
    const currentHost = host
    if (currentHost == null || runs.length === 0 || isDownloading) {
      throw new Error(
        'Unable to download: no host, nothing selected, or a download is already in progress.'
      )
    }

    setIsDownloading(true)
    setHasError(false)

    const zip = new JSZip()

    const results = await Promise.allSettled(
      runs.map(async run => {
        const matchingProtocol = protocols?.data.find(
          ({ id: protocolId }) => run.protocolId === protocolId
        )
        const matchingProtocolName = matchingProtocol?.metadata.protocolName
        const runDateTransformed = run.createdAt.replaceAll(':', '_')

        const res = await getRunRaw(currentHost, run.id, 'blob')
        const buf = await (res.data as Blob).arrayBuffer()

        zip.file(
          `${matchingProtocolName ?? run.id}_${runDateTransformed}.zip`,
          buf
        )

        return run // Resolve with the successfully processed run
      })
    )

    const successfulRuns: RunData[] = []

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulRuns.push(result.value)
      }
    })

    // If every single run failed, abort early without generating an empty zip file
    if (successfulRuns.length === 0) {
      setHasError(true)
      setIsDownloading(false)
      throw new Error('Failed to download any of the selected run records.')
    }

    try {
      const buffer = await zip.generateAsync({ type: 'arraybuffer' })
      const filename = `${robotName}-run-records.zip`

      if (callTimeUsbPath != null) {
        await saveFileToUsb(`${callTimeUsbPath}/${filename}`, buffer)
      } else {
        saveAs(new Blob([buffer]), filename)
      }

      setIsDownloading(false)
      return successfulRuns
    } catch (e) {
      setHasError(true)
      setIsDownloading(false)
      throw e
    }
  }

  return { downloadRuns, isDownloading, hasError }
}
