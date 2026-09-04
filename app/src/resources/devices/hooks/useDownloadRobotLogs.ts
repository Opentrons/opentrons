import { useMutation } from 'react-query'
import JSZip from 'jszip'
import last from 'lodash/last'

import { GET, request } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { saveFileWithPicker } from '/app/local-resources/files/saveFileWithPicker'
import { useRobot } from '/app/redux-resources/robots'
import { CONNECTABLE } from '/app/redux/discovery'
import { saveFileToUsb } from '/app/redux/shell/remote'

import type { UseMutationResult } from 'react-query'

export interface DownloadRobotLogsVariables {
  usbPath?: string
}

type UseDownloadRobotLogsResult = UseMutationResult<
  void,
  unknown,
  DownloadRobotLogsVariables
> & {
  canDownload: boolean
}

export function useDownloadRobotLogs(
  robotName: string
): UseDownloadRobotLogsResult {
  const robot = useRobot(robotName)
  const host = useHost()

  const canDownload =
    robot?.status === CONNECTABLE && robot?.health?.logs != null

  const downloadLogs = async ({
    usbPath,
  }: DownloadRobotLogsVariables): Promise<void> => {
    const logs = robot?.health?.logs
    if (!canDownload || host == null || logs == null) {
      throw new Error('Unable to download robot logs: robot is not connectable')
    }

    const zip = new JSZip()
    const results = await Promise.allSettled(
      logs.map(async log => {
        const logFileName = last(log.split('/')) ?? 'robot.log'
        const res = await request<string>(GET, log, host)
        zip.file(logFileName, res.data)
      })
    )

    // If every single log failed to download, abort early without generating an empty zip file
    if (
      results.length > 0 &&
      results.every(result => result.status === 'rejected')
    ) {
      throw new Error('Failed to download any of the robot logs.')
    }

    const buffer = await zip.generateAsync({ type: 'arraybuffer' })
    const filename = `${robotName}_logs.zip`
    if (usbPath != null) {
      await saveFileToUsb(`${usbPath}/${filename}`, buffer)
    } else {
      await saveFileWithPicker(filename, buffer)
    }
  }

  // Downloading logs doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation(downloadLogs)

  return { ...mutation, canDownload }
}
