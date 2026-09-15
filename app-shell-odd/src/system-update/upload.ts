import { BrowserWindow, ipcMain } from 'electron'

import { postFile } from '../http'
import { createLogger } from '../log'
import { SYSTEM_FILENAME } from './constants'
import { buildRobotHttpUrl } from './httpUrl'

import type { Dispatch } from '../types'

const log = createLogger('system-update/upload')

export const ROBOT_UPDATE_UPLOAD_CHANNEL = 'robot-update:upload'

export interface RobotUpdateUploadPayload {
  ip: string
  port: number | null
  name: string
  path: string
  systemFile: string
  userNotes?: string
  token?: string | null
  secure?: boolean
}

export function registerRobotUpdateUpload(): void {
  ipcMain.removeHandler(ROBOT_UPDATE_UPLOAD_CHANNEL)
  ipcMain.handle(
    ROBOT_UPDATE_UPLOAD_CHANNEL,
    (event, payload: RobotUpdateUploadPayload) => {
      const dispatch = createDispatchForSender(event.sender)

      if (payload.systemFile == null) {
        return Promise.reject(new Error('Robot update file missing'))
      }

      log.info('Uploading robot update file via IPC invoke', {
        robot: payload.name,
        path: payload.path,
      })

      const robot = { ip: payload.ip, port: payload.port }
      const urlPath = payload.path
      const systemFile = payload.systemFile
      const httpOptions = {
        token: payload.token,
        secure: payload.secure,
      }
      const url = buildRobotHttpUrl(robot, urlPath, httpOptions)

      const headers: Record<string, string> = {}
      if (payload.token != null && payload.token !== '') {
        headers.Authorization = `Bearer ${payload.token}`
      }
      if (payload.userNotes != null && payload.userNotes !== '') {
        headers['Opentrons-User-Notes'] = encodeURI(payload.userNotes)
      }

      return postFile(url, SYSTEM_FILENAME, systemFile, { headers })
        .then(() => {
          dispatch({
            type: 'robotUpdate:FILE_UPLOAD_DONE',
            payload: payload.name,
          })
          return { ok: true as const }
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown upload error'
          log.warn('Error uploading update to robot', {
            path: payload.path,
            systemFile: payload.systemFile,
            error,
          })
          throw new Error(`Error uploading update to robot: ${message}`)
        })
    }
  )
}

function createDispatchForSender(sender: Electron.WebContents): Dispatch {
  return function dispatch(action) {
    const window = BrowserWindow.fromWebContents(sender)
    if (window != null && !window.isDestroyed()) {
      log.silly('Sending action via IPC from upload handler', { action })
      window.webContents.send('dispatch', action)
    }
  }
}
