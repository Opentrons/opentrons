import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { dialog, ipcMain } from 'electron'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as Cfg from '../../config'
import * as Http from '../../http'
import { getSerialPortHttpAgent } from '../../usb'
import { registerDownloadHandlers } from '../ipc'

import type { BrowserWindow } from 'electron'
import type { Config } from '@opentrons/app/src/redux/config/types'

const ipcHandlers = new Map<
  string,
  (event: unknown, payload: unknown) => Promise<unknown>
>()

vi.mock('../../config', () => ({
  getFullConfig: vi.fn(),
}))
vi.mock('../../http', () => ({
  fetch: vi.fn(),
  fetchToFile: vi.fn(),
}))
vi.mock('../../usb', () => ({
  getSerialPortHttpAgent: vi.fn(),
}))
vi.mock('../../log', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}))
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp'),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(
      (
        channel: string,
        handler: (event: unknown, payload: unknown) => Promise<unknown>
      ) => {
        ipcHandlers.set(channel, handler)
      }
    ),
  },
}))

describe('app-shell fs/ipc', () => {
  const mockMainWindow = { id: 1 } as unknown as BrowserWindow
  let tempDir: string

  beforeEach(() => {
    ipcHandlers.clear()
    vi.mocked(ipcMain.handle).mockClear()
    tempDir = tempy.directory()
    vi.mocked(Cfg.getFullConfig).mockReturnValue({
      audit: { logDirectory: tempDir },
    } as Config)
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [tempDir],
    } as any)
    registerDownloadHandlers(mockMainWindow)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const invoke = async (
    channel: string,
    payload: unknown
  ): Promise<unknown> => {
    const handler = ipcHandlers.get(channel)
    if (handler == null) {
      throw new Error(`No handler registered for ${channel}`)
    }
    return await handler({}, payload)
  }

  describe('downloads:saveFileFromBuffer', () => {
    it('writes the buffer to the selected directory and returns the destination', async () => {
      const destination = await invoke('downloads:saveFileFromBuffer', {
        name: 'calibration.json',
        buffer: Buffer.from('{"ok":true}'),
      })

      expect(destination).toBe(tempDir)
      expect(dialog.showOpenDialog).toHaveBeenCalledWith(
        mockMainWindow,
        expect.objectContaining({
          defaultPath: tempDir,
          properties: ['openDirectory', 'createDirectory'],
        })
      )
      await expect(
        readFile(path.join(tempDir, 'calibration.json'), 'utf8')
      ).resolves.toBe('{"ok":true}')
    })

    it('skips the picker when destination is provided', async () => {
      const destination = await invoke('downloads:saveFileFromBuffer', {
        name: 'runs.json',
        buffer: Array.from(Buffer.from('[]')),
        destination: tempDir,
      })

      expect(destination).toBe(tempDir)
      expect(dialog.showOpenDialog).not.toHaveBeenCalled()
      await expect(
        readFile(path.join(tempDir, 'runs.json'), 'utf8')
      ).resolves.toBe('[]')
    })

    it('does not overwrite an existing file with the same name', async () => {
      await writeFile(path.join(tempDir, 'calibration.json'), 'original')

      await invoke('downloads:saveFileFromBuffer', {
        name: 'calibration.json',
        buffer: Buffer.from('new-contents'),
        destination: tempDir,
      })

      await expect(
        readFile(path.join(tempDir, 'calibration.json'), 'utf8')
      ).resolves.toBe('original')
      await expect(
        readFile(path.join(tempDir, 'calibration (1).json'), 'utf8')
      ).resolves.toBe('new-contents')
    })

    it('increments the suffix when prior numbered copies already exist', async () => {
      await writeFile(path.join(tempDir, 'calibration.json'), 'original')
      await writeFile(path.join(tempDir, 'calibration (1).json'), 'copy-1')

      await invoke('downloads:saveFileFromBuffer', {
        name: 'calibration.json',
        buffer: Buffer.from('copy-2'),
        destination: tempDir,
      })

      await expect(
        readFile(path.join(tempDir, 'calibration.json'), 'utf8')
      ).resolves.toBe('original')
      await expect(
        readFile(path.join(tempDir, 'calibration (1).json'), 'utf8')
      ).resolves.toBe('copy-1')
      await expect(
        readFile(path.join(tempDir, 'calibration (2).json'), 'utf8')
      ).resolves.toBe('copy-2')
    })

    it('throws FileSaveCanceledError when the dialog is canceled', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      } as any)

      await expect(
        invoke('downloads:saveFileFromBuffer', {
          name: 'calibration.json',
          buffer: Buffer.from('{}'),
        })
      ).rejects.toMatchObject({
        name: 'FileSaveCanceledError',
        message: 'File save canceled',
      })
    })
  })

  describe('downloads:saveFileFromUrl', () => {
    it('downloads to the destination and returns the directory', async () => {
      vi.mocked(Http.fetchToFile).mockImplementation(async (_url, filePath) => {
        const { writeFile } = await import('fs/promises')
        await writeFile(filePath, 'zip-bytes')
        return filePath
      })

      const destination = await invoke('downloads:saveFileFromUrl', {
        name: 'run.zip',
        source: '/runs/run-1/download?runLog=true',
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      expect(destination).toBe(tempDir)
      expect(Http.fetchToFile).toHaveBeenCalledWith(
        'http://10.0.0.5:31950/runs/run-1/download?runLog=true',
        path.join(tempDir, 'run.zip'),
        expect.objectContaining({
          onResponse: expect.any(Function),
        })
      )
      await expect(
        readFile(path.join(tempDir, 'run.zip'), 'utf8')
      ).resolves.toBe('zip-bytes')
    })

    it('throws EmptyDownloadError when the response is 204', async () => {
      vi.mocked(Http.fetchToFile).mockImplementation(
        async (_url, filePath, options) => {
          options?.onResponse?.({ status: 204 } as any)
          return filePath
        }
      )

      await expect(
        invoke('downloads:saveFileFromUrl', {
          name: 'run.zip',
          source: '/runs/run-1/download',
          hostname: '10.0.0.5',
          port: 31950,
          destination: tempDir,
        })
      ).rejects.toMatchObject({
        name: 'EmptyDownloadError',
        message: 'Empty download',
      })
    })

    it('downloads to a unique path when the target filename exists', async () => {
      await writeFile(path.join(tempDir, 'run.zip'), 'existing')
      vi.mocked(Http.fetchToFile).mockImplementation(async (_url, filePath) => {
        await writeFile(filePath, 'zip-bytes')
        return filePath
      })

      await invoke('downloads:saveFileFromUrl', {
        name: 'run.zip',
        source: '/runs/run-1/download',
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      expect(Http.fetchToFile).toHaveBeenCalledWith(
        expect.any(String),
        path.join(tempDir, 'run (1).zip'),
        expect.any(Object)
      )
      await expect(
        readFile(path.join(tempDir, 'run.zip'), 'utf8')
      ).resolves.toBe('existing')
      await expect(
        readFile(path.join(tempDir, 'run (1).zip'), 'utf8')
      ).resolves.toBe('zip-bytes')
    })

    it('uses the serial port agent for opentrons-usb hosts', async () => {
      const mockAgent = { usb: true }
      vi.mocked(getSerialPortHttpAgent).mockReturnValue(mockAgent as any)
      vi.mocked(Http.fetchToFile).mockResolvedValue(
        path.join(tempDir, 'run.zip')
      )

      await invoke('downloads:saveFileFromUrl', {
        name: 'run.zip',
        source: '/runs/run-1/download',
        hostname: 'opentrons-usb',
        port: 31950,
        destination: tempDir,
      })

      expect(Http.fetchToFile).toHaveBeenCalledWith(
        'http://opentrons-usb:31950/runs/run-1/download',
        path.join(tempDir, 'run.zip'),
        expect.objectContaining({
          requestInit: { agent: mockAgent },
        })
      )
    })
  })

  describe('downloads:saveLogs', () => {
    it('zips fetched logs into the destination directory', async () => {
      vi.mocked(Http.fetch)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: async () => Buffer.from('api-log'),
        } as any)
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: async () => Buffer.from('serial-log'),
        } as any)

      const result = await invoke('downloads:saveLogs', {
        name: 'otie_logs.zip',
        paths: ['/logs/api.log', '/logs/serial.log'],
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      expect(result).toEqual({
        directory: tempDir,
        succeededPaths: ['/logs/api.log', '/logs/serial.log'],
      })
      expect(Http.fetch).toHaveBeenCalledWith(
        'http://10.0.0.5:31950/logs/api.log',
        undefined
      )
      expect(Http.fetch).toHaveBeenCalledWith(
        'http://10.0.0.5:31950/logs/serial.log',
        undefined
      )

      const zipBytes = await readFile(path.join(tempDir, 'otie_logs.zip'))
      expect(zipBytes.byteLength).toBeGreaterThan(0)
    })

    it('uses explicit zip entry names when provided', async () => {
      vi.mocked(Http.fetch).mockResolvedValue({
        status: 200,
        arrayBuffer: async () => Buffer.from('run-bytes'),
      } as any)

      const result = await invoke('downloads:saveLogs', {
        name: 'otie-run-records.zip',
        paths: [
          {
            path: '/runs/run-1/download?runLog=true',
            name: 'My Protocol_2024.zip',
          },
        ],
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      expect(result).toEqual({
        directory: tempDir,
        succeededPaths: ['/runs/run-1/download?runLog=true'],
      })
      const zipBytes = await readFile(
        path.join(tempDir, 'otie-run-records.zip')
      )
      expect(zipBytes.byteLength).toBeGreaterThan(0)
    })

    it('writes a uniquely named zip when the target filename exists', async () => {
      await writeFile(path.join(tempDir, 'otie_logs.zip'), 'existing')
      vi.mocked(Http.fetch).mockResolvedValue({
        status: 200,
        arrayBuffer: async () => Buffer.from('api-log'),
      } as any)

      await invoke('downloads:saveLogs', {
        name: 'otie_logs.zip',
        paths: ['/logs/api.log'],
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      await expect(
        readFile(path.join(tempDir, 'otie_logs.zip'), 'utf8')
      ).resolves.toBe('existing')
      const zipBytes = await readFile(path.join(tempDir, 'otie_logs (1).zip'))
      expect(zipBytes.byteLength).toBeGreaterThan(0)
    })

    it('still writes a zip when some log fetches fail', async () => {
      vi.mocked(Http.fetch)
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce({
          status: 200,
          arrayBuffer: async () => Buffer.from('serial-log'),
        } as any)

      await invoke('downloads:saveLogs', {
        name: 'otie_logs.zip',
        paths: ['/logs/api.log', '/logs/serial.log'],
        hostname: '10.0.0.5',
        port: 31950,
        destination: tempDir,
      })

      const zipBytes = await readFile(path.join(tempDir, 'otie_logs.zip'))
      expect(zipBytes.byteLength).toBeGreaterThan(0)
    })

    it('throws when every log fetch fails', async () => {
      vi.mocked(Http.fetch).mockRejectedValue(new Error('network'))

      await expect(
        invoke('downloads:saveLogs', {
          name: 'otie_logs.zip',
          paths: ['/logs/api.log'],
          hostname: '10.0.0.5',
          port: 31950,
          destination: tempDir,
        })
      ).rejects.toThrow('Failed to download any of the requested files.')
    })

    it('throws FileSaveCanceledError when the dialog is canceled', async () => {
      vi.mocked(dialog.showOpenDialog).mockResolvedValue({
        canceled: true,
        filePaths: [],
      } as any)

      await expect(
        invoke('downloads:saveLogs', {
          name: 'otie_logs.zip',
          paths: ['/logs/api.log'],
          hostname: '10.0.0.5',
          port: 31950,
        })
      ).rejects.toMatchObject({
        name: 'FileSaveCanceledError',
      })
      expect(Http.fetch).not.toHaveBeenCalled()
    })
  })
})
