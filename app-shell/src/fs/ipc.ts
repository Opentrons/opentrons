import { createWriteStream } from 'fs'
import { writeFile } from 'fs/promises'
import { ZipArchive } from 'archiver'
import { dialog, ipcMain } from 'electron'
import last from 'lodash/last'

import { getFullConfig } from '../config'
import { fetch, fetchToFile } from '../http'
import { createLogger } from '../log'
import { buildRobotHttpUrl } from '../robot-update/httpUrl'
import { getSerialPortHttpAgent } from '../usb'
import { resolveUniqueFilePath } from './utils'

import type {
  BrowserWindow,
  OpenDialogOptions,
  OpenDialogReturnValue,
} from 'electron/main'

const log = createLogger('fs/ipc')

/** Thrown when the user cancels the save dialog. Name is checked across IPC. */
export function createFileSaveCanceledError(): Error {
  const error = new Error('File save canceled')
  error.name = 'FileSaveCanceledError'
  return error
}

/** Thrown when the robot returns an empty download (HTTP 204). */
export function createEmptyDownloadError(): Error {
  const error = new Error('Empty download')
  error.name = 'EmptyDownloadError'
  return error
}

interface SaveLogsPathEntry {
  path: string
  /** Zip entry filename. Defaults to the last path segment (query stripped). */
  name?: string
}

interface SaveLogsPayload {
  // e.g. health.logs "/logs/serial.log", or run download URLs with entry names
  paths: Array<string | SaveLogsPathEntry>
  name: string // e.g. `${robotName}_logs.zip` or `${robotName}-run-records.zip`
  destination?: string
  hostname: string
  port: number | null
}

interface SaveLogsResult {
  directory: string
  /** Source paths that were fetched and included in the zip. */
  succeededPaths: string[]
}

function normalizeSaveLogsPath(entry: string | SaveLogsPathEntry): {
  path: string
  name: string
} {
  if (typeof entry === 'string') {
    const withoutQuery = entry.split('?')[0] ?? entry
    return {
      path: entry,
      name: last(withoutQuery.split('/')) ?? 'download',
    }
  }
  const withoutQuery = entry.path.split('?')[0] ?? entry.path
  return {
    path: entry.path,
    name: entry.name ?? last(withoutQuery.split('/')) ?? 'download',
  }
}

interface SaveFilePayload {
  source: string
  name: string
  destination?: string
  hostname: string
  port: number | null
}

interface SaveFileFromBufferPayload {
  // IPC may deliver a Buffer, Uint8Array, or number[]
  buffer: Buffer | Uint8Array | number[]
  name: string
  destination?: string
}

async function writeZipFile(
  outputPath: string,
  entries: Array<{ name: string; content: Buffer }>
): Promise<void> {
  const output = createWriteStream(outputPath)
  const archive = new ZipArchive()
  const archiveClosed = new Promise<void>((resolve, reject) => {
    output.on('close', resolve)
    output.on('error', reject)
    archive.on('error', reject)
  })
  archive.pipe(output)
  for (const { name, content } of entries) {
    archive.append(content, { name })
  }
  await archive.finalize()
  await archiveClosed
}

async function resolveSaveDirectory(
  mainWindow: BrowserWindow,
  destination?: string
): Promise<string> {
  if (destination) {
    return destination
  }

  const config = getFullConfig()
  const dialogOptions: OpenDialogOptions = {
    defaultPath: config.audit.logDirectory ?? '',
    buttonLabel: 'Save',
    properties: ['openDirectory', 'createDirectory'],
  }
  const filePaths = await dialog
    .showOpenDialog(mainWindow, dialogOptions)
    .then((result: OpenDialogReturnValue) => {
      return result.canceled ? [] : result.filePaths
    })

  const directory = filePaths[0]
  if (directory == null || directory === '') {
    throw createFileSaveCanceledError()
  }
  return directory
}

export function registerDownloadHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'downloads:saveLogs',
    async (_, payload: SaveLogsPayload): Promise<SaveLogsResult> => {
      const { paths, name, destination, hostname, port } = payload
      const normalizedPaths = paths.map(normalizeSaveLogsPath)

      const directory = await resolveSaveDirectory(mainWindow, destination)

      const usb = hostname === 'opentrons-usb' // match audit pattern
      const agent = usb ? getSerialPortHttpAgent() : undefined
      const requestInit = agent != null ? { agent } : undefined

      log.debug('saveLogs: dialog done', { directory })
      log.debug('saveLogs: fetching', {
        paths: normalizedPaths.map(p => p.path),
      })

      const entries = await Promise.allSettled(
        normalizedPaths.map(async ({ path: sourcePath, name: entryName }) => {
          const url = buildRobotHttpUrl({ ip: hostname, port }, sourcePath, {
            forceHttp: usb,
          })
          const response = await fetch(url, requestInit)
          if (response.status === 204) {
            throw createEmptyDownloadError()
          }
          const content = Buffer.from(await response.arrayBuffer())
          return {
            sourcePath,
            name: entryName,
            content,
          }
        })
      )

      const succeeded = entries.flatMap(r =>
        r.status === 'fulfilled' ? [r.value] : []
      )
      if (paths.length > 0 && succeeded.length === 0) {
        throw new Error('Failed to download any of the requested files.')
      }

      log.debug('saveLogs: fetched', { count: succeeded.length })

      const filePath = await resolveUniqueFilePath(directory, name)

      log.debug('saveLogs: writing zip', { filePath })

      await writeZipFile(
        filePath,
        succeeded.map(({ name: entryName, content }) => ({
          name: entryName,
          content,
        }))
      )

      log.info('saveLogs: done', { filePath })
      return {
        directory,
        succeededPaths: succeeded.map(({ sourcePath }) => sourcePath),
      }
    }
  )

  ipcMain.handle(
    'downloads:saveFileFromUrl',
    async (_, payload: SaveFilePayload): Promise<string> => {
      const { source, name, destination, hostname, port } = payload

      const directory = await resolveSaveDirectory(mainWindow, destination)

      const filePath = await resolveUniqueFilePath(directory, name)

      log.debug('saveFileFromUrl: writing file', { filePath })

      const usb = hostname === 'opentrons-usb' // match audit pattern
      const agent = usb ? getSerialPortHttpAgent() : undefined
      const requestInit = agent != null ? { agent } : undefined

      const url = buildRobotHttpUrl({ ip: hostname, port }, source, {
        forceHttp: usb,
      })

      await fetchToFile(url, filePath, {
        requestInit,
        onResponse: response => {
          if (response.status === 204) {
            throw createEmptyDownloadError()
          }
        },
      })

      log.info('saveFileFromUrl: done', { filePath })
      return directory
    }
  )

  ipcMain.handle(
    'downloads:saveFileFromBuffer',
    async (_, payload: SaveFileFromBufferPayload): Promise<string> => {
      const { buffer, name, destination } = payload

      const directory = await resolveSaveDirectory(mainWindow, destination)

      const filePath = await resolveUniqueFilePath(directory, name)
      log.debug('saveFileFromBuffer: writing file', { filePath })

      await writeFile(filePath, Buffer.from(buffer))

      log.info('saveFileFromBuffer: done', { filePath })
      return directory
    }
  )
}
