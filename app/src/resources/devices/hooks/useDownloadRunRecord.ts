import { useState } from 'react'
import { saveAs } from 'file-saver'

import { getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { saveFileToUsb } from '/app/redux/shell/remote'

import type { RunData } from '@opentrons/api-client'

export function useDownloadRunRecord(
  run: RunData,
  onError?: (error: Error) => void
): {
  downloadRunRecord: (usbPath?: string) => Promise<void>
  isDownloading: boolean
} {
  const host = useHost()
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: protocols } = useAllProtocolsQuery()

  const matchingProtocol = protocols?.data.find(
    ({ id: protocolId }) => run.protocolId === protocolId
  )
  const matchingProtocolName = matchingProtocol?.metadata.protocolName
  const runDateTransformed = run.createdAt.replaceAll(':', '_')

  const downloadRunRecord = (usbPath?: string): Promise<void> => {
    if (host == null) {
      return Promise.resolve()
    }
    setIsDownloading(true)
    const filename = `${matchingProtocolName ?? run.id}_${runDateTransformed}.zip`
    return getRunRaw(host, run.id, 'blob')
      .then(async res => {
        if (usbPath != null) {
          const buffer = await (res.data as Blob).arrayBuffer()
          await saveFileToUsb(`${usbPath}/${filename}`, buffer)
        } else {
          saveAs(res.data as Blob, filename)
        }
        setIsDownloading(false)
      })
      .catch((e: Error) => {
        setIsDownloading(false)
        onError?.(e)
        throw e
      })
  }

  return { downloadRunRecord, isDownloading }
}
