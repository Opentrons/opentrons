import { useMutation } from 'react-query'

import { useHost } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { CONNECTABLE } from '/app/redux/discovery'
import { remote } from '/app/redux/shell/remote'

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

    const name = `${robotName}_logs.zip`

    const result: boolean = await remote.ipcRenderer.invoke(
      'downloads:saveLogs',
      {
        name,
        paths: logs,
        hostname: host.hostname,
        port: host.port,
        destination: usbPath,
      }
    )

    if (!result) {
      throw new Error('Failed to download robot logs')
    }
  }

  // Downloading logs doesn't mutate robot state, so it doesn't need
  // to go through useDocumentedMutation.
  // eslint-disable-next-line opentrons/no-direct-use-mutation
  const mutation = useMutation(downloadLogs)

  return { ...mutation, canDownload }
}
