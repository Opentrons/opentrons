import { useState } from 'react'
import { useSelector } from 'react-redux'

import { DEFAULT_RUN_DOWNLOAD_PARAMS, getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import {
  isFileSaveCanceledError,
  saveFileWithPicker,
} from '/app/local-resources/files/saveFileWithPicker'
import { getIncludeProtocolSourceInRunDownload } from '/app/redux/config'
import { saveFileToUsb } from '/app/redux/shell/remote'

import { isEmptyDownloadResponse } from './utils/isEmptyDownloadResponse'

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
  const includeProtocolSource = useSelector(
    getIncludeProtocolSourceInRunDownload
  )

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
    const params = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: includeProtocolSource,
    }

    return getRunRaw(host, run.id, params, 'blob')
      .then(async res => {
        if (isEmptyDownloadResponse(res.data, res.status)) {
          setIsDownloading(false)
          return
        }
        if (usbPath != null) {
          const buffer = await (res.data as Blob).arrayBuffer()
          await saveFileToUsb(`${usbPath}/${filename}`, buffer)
        } else {
          await saveFileWithPicker(filename, res.data as Blob)
        }
        setIsDownloading(false)
      })
      .catch((e: Error) => {
        setIsDownloading(false)
        if (isFileSaveCanceledError(e)) {
          return
        }
        onError?.(e)
        throw e
      })
  }

  return { downloadRunRecord, isDownloading }
}
