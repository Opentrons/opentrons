import { useState } from 'react'
import { useSelector } from 'react-redux'

import { DEFAULT_RUN_DOWNLOAD_PARAMS } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import { getIncludeProtocolSourceInRunDownload } from '/app/redux/config'
import { remote } from '/app/redux/shell/remote'

import { isEmptyDownloadError } from './utils/isEmptyDownloadResponse'

import type { GetRunDownloadParams, RunData } from '@opentrons/api-client'

function buildRunDownloadSource(
  runId: string,
  params: Required<GetRunDownloadParams>
): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    search.set(key, String(value))
  }
  return `/runs/${runId}/download?${search.toString()}`
}

export function useDownloadRunRecord(
  run: RunData,
  onError?: (error: Error) => void
): {
  downloadRunRecord: (destination?: string) => Promise<string | void>
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

  const downloadRunRecord = async (
    destination?: string
  ): Promise<string | undefined> => {
    const id: string = run.id
    if (host == null || id == null) {
      return
    }

    setIsDownloading(true)
    const filename = `${matchingProtocolName ?? run.id}_${runDateTransformed}.zip`
    const params = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: includeProtocolSource,
    }

    try {
      return await remote.ipcRenderer.invoke('downloads:saveFileFromUrl', {
        name: filename,
        source: buildRunDownloadSource(id, params),
        hostname: host.hostname,
        port: host.port ?? null,
        destination,
        token: host.token,
        secure: host.secure,
      })
    } catch (error) {
      // Match previous getRunRaw behavior: cancel and empty (204) are silent.
      if (isFileSaveCanceledError(error) || isEmptyDownloadError(error)) {
        return
      }
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      throw err
    } finally {
      setIsDownloading(false)
    }
  }

  return { downloadRunRecord, isDownloading }
}
