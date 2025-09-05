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

export function openCameraStream(
  robotIp: string,
  log: Logger
): CameraStreamDetails {
  const createUi = (): BrowserWindow => createCameraStreamUi(robotIp, log)
  const windowId = getWindowIdCameraStream(robotIp)

  return { createUi, windowId, type: 'camera-stream' }
}

function getWindowIdCameraStream(robotIp: string): string {
  return `camera-stream-${robotIp}`
}

const STREAM_URL = `${SECONDARY_WINDOW_CONFIG.url.protocol}//${SECONDARY_WINDOW_URL_PATH}#/camera-stream`

function createCameraStreamUi(robotIp: string, log: Logger): BrowserWindow {
  log.debug('Creating camera stream window', {
    robotIp,
    options: SECONDARY_WINDOW_OPTS,
    url: STREAM_URL,
  })

  const cameraStreamWindow = new BrowserWindow(SECONDARY_WINDOW_OPTS).once(
    'ready-to-show',
    () => {
      log.debug('Camera stream window ready to show')
      cameraStreamWindow.setTitle('Live camera view')
      cameraStreamWindow.show()

      log.debug('Sending camera stream config to renderer', { robotIp })
      cameraStreamWindow.webContents.send(
        'camera-stream-config',
        `http://${robotIp}:31950/hls/stream.m3u8`
      )
    }
  )

  log.info(`Loading camera stream from ${STREAM_URL}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  cameraStreamWindow.loadURL(STREAM_URL, {
    extraHeaders: 'pragma: no-cache\n',
  })

  cameraStreamWindow.webContents.setWindowOpenHandler(({ url }) => {
    // eslint-disable-next-line no-void
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return cameraStreamWindow
}
