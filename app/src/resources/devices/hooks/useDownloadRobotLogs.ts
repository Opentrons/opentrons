import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import last from 'lodash/last'

import { GET, request } from '@opentrons/api-client'
import { ERROR_TOAST, INFO_TOAST } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'
import { useRobot } from '/app/redux-resources/robots'
import { CONNECTABLE } from '/app/redux/discovery'
import { saveFileToUsb } from '/app/redux/shell/remote'

import type { IconProps } from '@opentrons/components'

interface UseDownloadRobotLogsResult {
  downloadLogs: (usbPath?: string) => Promise<void>
  isDownloading: boolean
  hasError: boolean
  canDownload: boolean
}

export function useDownloadRobotLogs(
  robotName: string
): UseDownloadRobotLogsResult {
  const { t } = useTranslation('device_settings')
  const robot = useRobot(robotName)
  const host = useHost()
  const { makeToast, eatToast } = useToaster()
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const canDownload =
    robot?.status === CONNECTABLE && robot?.health?.logs != null

  const downloadLogs = (usbPath?: string): Promise<void> => {
    if (!canDownload || host == null || robot?.health?.logs == null) {
      return Promise.resolve()
    }

    setIsDownloading(true)
    setHasError(false)
    const toastIcon: IconProps = { name: 'ot-spinner', spin: true }
    const toastId = makeToast(t('downloading_logs') as string, INFO_TOAST, {
      disableTimeout: true,
      icon: toastIcon,
    })

    const zip = new JSZip()
    return Promise.all(
      robot.health.logs.map(log => {
        const logFileName = last(log.split('/')) ?? 'robot.log'
        return request<string>(GET, log, host).then(res => {
          zip.file(logFileName, res.data)
        })
      })
    )
      .then(() => zip.generateAsync({ type: 'arraybuffer' }))
      .then(async buffer => {
        const filename = `${robotName}_logs.zip`
        if (usbPath != null) {
          await saveFileToUsb(`${usbPath}/${filename}`, buffer)
        } else {
          saveAs(new Blob([buffer]), filename)
        }
      })
      .then(() => {
        eatToast(toastId)
        if (isMounted.current) {
          setIsDownloading(false)
        }
      })
      .catch((e: Error) => {
        eatToast(toastId)
        makeToast(e.message, ERROR_TOAST, { closeButton: true })
        if (isMounted.current) {
          setHasError(true)
          setIsDownloading(false)
        }
        throw e
      })
  }

  return { downloadLogs, isDownloading, hasError, canDownload }
}
