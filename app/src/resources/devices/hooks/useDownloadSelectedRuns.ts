import { useMutation } from 'react-query'
import { useSelector } from 'react-redux'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

import { DEFAULT_RUN_DOWNLOAD_PARAMS, getRunRaw } from '@opentrons/api-client'
import { useAllProtocolsQuery, useHost } from '@opentrons/react-api-client'

import { getIncludeProtocolSourceInRunDownload } from '/app/redux/config'
import { saveFileToUsb } from '/app/redux/shell/remote'

import { isEmptyDownloadResponse } from './utils/isEmptyDownloadResponse'

import type { UseMutationResult } from 'react-query'
import type { RunData } from '@opentrons/api-client'

export interface DownloadRunsVariables {
  runs: readonly RunData[]
  callTimeUsbPath?: string
}

export function useDownloadSelectedRuns(
  robotName: string
): UseMutationResult<readonly RunData[], unknown, DownloadRunsVariables> {
  const host = useHost()
  const includeProtocolSource = useSelector(
    getIncludeProtocolSourceInRunDownload
  )
  const { data: protocols } = useAllProtocolsQuery()

  const downloadRuns = async ({
    runs,
    callTimeUsbPath,
  }: DownloadRunsVariables): Promise<readonly RunData[]> => {
    const currentHost = host
    if (currentHost == null || runs.length === 0) {
      throw new Error('Unable to download: no host, or nothing selected.')
    }

    const zip = new JSZip()
    const params = {
      ...DEFAULT_RUN_DOWNLOAD_PARAMS,
      protocol: includeProtocolSource,
    }

    const results = await Promise.allSettled(
      runs.map(async run => {
        const matchingProtocol = protocols?.data.find(
          ({ id: protocolId }) => run.protocolId === protocolId
        )
        const matchingProtocolName = matchingProtocol?.metadata.protocolName
        const runDateTransformed = run.createdAt.replaceAll(':', '_')

        const res = await getRunRaw(currentHost, run.id, params, 'blob')
        if (isEmptyDownloadResponse(res.data, res.status)) {
          throw new Error(`No downloadable content for run ${run.id}`)
        }
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
      throw new Error('Failed to download any of the selected run records.')
    }

    const buffer = await zip.generateAsync({ type: 'arraybuffer' })
    const filename = `${robotName}-run-records.zip`

    if (callTimeUsbPath != null) {
      await saveFileToUsb(`${callTimeUsbPath}/${filename}`, buffer)
    } else {
      saveAs(new Blob([buffer]), filename)
    }

    return successfulRuns
  }

  // Downloading runs doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  return useMutation(downloadRuns)
}
