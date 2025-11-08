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
  runId: string
  windowTitle: string
  robotIp: string
  robotName: string
  log: Logger
}

export function openCameraStream(
  params: OpenCameraStreamParams
): CameraStreamDetails {
  const createUi = (): BrowserWindow => createCameraStreamUi(params)
  const windowId = getWindowIdCameraStream(params.robotIp)

  return { createUi, windowId, type: 'camera-stream' }
}

function getWindowIdCameraStream(robotIp: string): string {
  return `camera-stream-${robotIp}`
}

const STREAM_URL = (robotName: string, runId: string): string =>
  `${
    SECONDARY_WINDOW_CONFIG.url.protocol
  }//${SECONDARY_WINDOW_URL_PATH}#/devices/${encodeURIComponent(
    robotName
  )}/camera-stream?runId=${encodeURIComponent(runId)}`

function createCameraStreamUi({
  log,
  robotName,
  windowTitle,
  robotIp,
  runId,
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

  log.info(`Loading camera stream from ${STREAM_URL(robotName, runId)}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  cameraStreamWindow.loadURL(STREAM_URL(robotName, runId), {
    extraHeaders: 'pragma: no-cache\n',
  })

  cameraStreamWindow.webContents.setWindowOpenHandler(({ url }) => {
    // eslint-disable-next-line no-void
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return cameraStreamWindow
}
