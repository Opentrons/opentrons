import { BrowserWindow, shell } from 'electron'

import {
  SECONDARY_WINDOW_CONFIG,
  SECONDARY_WINDOW_OPTS,
  SECONDARY_WINDOW_URL_PATH,
} from '../ui'

import type { Logger } from 'winston'
import type { SecondaryWindowDetails } from '../types'

interface CameraStreamDetails extends SecondaryWindowDetails {
  type: 'camera-stream'
}

interface OpenCameraStreamParams {
  windowTitle: string
  robotIp: string
  robotName: string
  log: Logger
}

export function openCameraStream(
  params: OpenCameraStreamParams
): CameraStreamDetails {
  const createUi = (): BrowserWindow => createCameraStreamUi(params)

  return { createUi, key: params.robotIp, type: 'camera-stream' }
}

const STREAM_URL = (robotName: string): string =>
  `${
    SECONDARY_WINDOW_CONFIG.url.protocol
  }//${SECONDARY_WINDOW_URL_PATH}#/devices/${encodeURIComponent(
    robotName
  )}/camera-stream`

function createCameraStreamUi({
  log,
  robotName,
  windowTitle,
  robotIp,
}: OpenCameraStreamParams): BrowserWindow {
  log.debug('Creating camera stream window', {
    robotIp,
    options: SECONDARY_WINDOW_OPTS,
    url: STREAM_URL,
  })

  const cameraStreamWindow = new BrowserWindow(SECONDARY_WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Camera stream window ready to show')
      cameraStreamWindow.setTitle(windowTitle)
      cameraStreamWindow.show()
    }
  )

  log.info(`Loading camera stream from ${STREAM_URL(robotName)}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  cameraStreamWindow.loadURL(STREAM_URL(robotName), {
    extraHeaders: 'pragma: no-cache\n',
  })

  cameraStreamWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return cameraStreamWindow
}
