import { BrowserWindow, shell } from 'electron'

import {
  SECONDARY_WINDOW_CONFIG,
  SECONDARY_WINDOW_OPTS,
  SECONDARY_WINDOW_URL_PATH,
} from '../ui'

import type { Logger } from 'winston'
import type { SecondaryWindowDetails } from '../types'

const WINDOW_DEFAULT_WIDTH_PX = 876
const WINDOW_DEFAULT_HEIGHT_PX = 524

interface CameraPhotoDetails extends SecondaryWindowDetails {
  type: 'camera-photo'
}

interface OpenCameraPhotoParams {
  robotName: string
  windowTitle: string
  photoUrl: string
  log: Logger
}

export function openCameraPhoto(
  params: OpenCameraPhotoParams
): CameraPhotoDetails {
  const createUi = (): BrowserWindow => createCameraPhotoUi(params)

  return { createUi, key: params.photoUrl, type: 'camera-photo' }
}

const PHOTO_URL = (robotName: string, photoUrl: string): string => {
  const encodedPhotoUrl = encodeURIComponent(photoUrl)
  return `${
    SECONDARY_WINDOW_CONFIG.url.protocol
  }//${SECONDARY_WINDOW_URL_PATH}#/devices/${encodeURIComponent(
    robotName
  )}/camera-photo?photoUrl=${encodedPhotoUrl}`
}

function createCameraPhotoUi({
  log,
  robotName,
  windowTitle,
  photoUrl,
}: OpenCameraPhotoParams): BrowserWindow {
  log.debug('Creating camera photo window', {
    photoUrl,
  })

  const cameraPhotoWindow = new BrowserWindow({
    ...SECONDARY_WINDOW_OPTS,
    width: WINDOW_DEFAULT_WIDTH_PX,
    height: WINDOW_DEFAULT_HEIGHT_PX,
    minWidth: 100,
    minHeight: 100,
  }).once('ready-to-show', () => {
    log.debug('Camera photo window ready to show')
    cameraPhotoWindow.setTitle(windowTitle)
    // TODO(jh, 10-29-25): We should set the aspect ratio based on the default
    //  pic dimensions themselves.
    cameraPhotoWindow.setAspectRatio(
      WINDOW_DEFAULT_WIDTH_PX / WINDOW_DEFAULT_HEIGHT_PX
    )
    cameraPhotoWindow.show()
  })

  const url = PHOTO_URL(robotName, photoUrl)
  log.info(`Loading camera photo from ${url}`)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  cameraPhotoWindow.loadURL(url, {
    extraHeaders: 'pragma: no-cache\n',
  })

  cameraPhotoWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  return cameraPhotoWindow
}
