import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { ipcMain } from 'electron'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as Http from '../../http'
import { registerDownloadHandlers } from '../ipc'

const ipcHandlers = new Map<
  string,
  (event: unknown, payload: unknown) => Promise<unknown>
>()

vi.mock('../../http', () => ({
  fetch: vi.fn(),
  fetchToFile: vi.fn(),
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

describe('app-shell-odd fs/ipc', () => {
  let tempDir: string

  beforeEach(() => {
    ipcHandlers.clear()
    vi.mocked(ipcMain.handle).mockClear()
    tempDir = tempy.directory()
    registerDownloadHandlers()
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
    return handler({}, payload)
  }

  describe('downloads:saveFileFromBuffer', () => {
    it('writes the buffer to the USB destination and returns it', async () => {
      const destination = await invoke('downloads:saveFileFromBuffer', {
        name: 'calibration.json',
        buffer: Buffer.from('{"ok":true}'),
        destination: tempDir,
      })

      expect(destination).toBe(tempDir)
      await expect(
        readFile(path.join(tempDir, 'calibration.json'), 'utf8')
      ).resolves.toBe('{"ok":true}')
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

    it('throws FileSaveCanceledError when destination is missing', async () => {
      await expect(
        invoke('downloads:saveFileFromBuffer', {
          name: 'calibration.json',
          buffer: Buffer.from('{}'),
        })
      ).rejects.toMatchObject({
        name: 'FileSaveCanceledError',
      })
    })

    it('throws when the destination is not writable', async () => {
      await expect(
        invoke('downloads:saveFileFromBuffer', {
          name: 'calibration.json',
          buffer: Buffer.from('{}'),
          destination: path.join(tempDir, 'missing-usb'),
        })
      ).rejects.toThrow('USB device not found or not writable')
    })
  })

  describe('downloads:saveFileFromUrl', () => {
    it('downloads to the USB destination and returns it', async () => {
      const { writeFile } = await import('fs/promises')
      vi.mocked(Http.fetchToFile).mockImplementation(async (_url, filePath) => {
        await writeFile(filePath, 'zip-bytes')
        return filePath
      })

      const destination = await invoke('downloads:saveFileFromUrl', {
        name: 'run.zip',
        source: '/runs/run-1/download?runLog=true',
        hostname: 'localhost',
        port: 31950,
        destination: tempDir,
      })

      expect(destination).toBe(tempDir)
      expect(Http.fetchToFile).toHaveBeenCalledWith(
        'http://localhost:31950/runs/run-1/download?runLog=true',
        path.join(tempDir, 'run.zip'),
        expect.objectContaining({
          onResponse: expect.any(Function),
        })
      )
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
          hostname: 'localhost',
          port: 31950,
          destination: tempDir,
        })
      ).rejects.toMatchObject({
        name: 'EmptyDownloadError',
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
        hostname: 'localhost',
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
    })
  })

  describe('downloads:saveLogs', () => {
    it('zips fetched logs onto the USB destination', async () => {
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
        hostname: 'localhost',
        port: 31950,
        destination: tempDir,
      })

      expect(result).toEqual({
        directory: tempDir,
        succeededPaths: ['/logs/api.log', '/logs/serial.log'],
      })
      const zipBytes = await readFile(path.join(tempDir, 'otie_logs.zip'))
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
        hostname: 'localhost',
        port: 31950,
        destination: tempDir,
      })

      await expect(
        readFile(path.join(tempDir, 'otie_logs.zip'), 'utf8')
      ).resolves.toBe('existing')
      const zipBytes = await readFile(path.join(tempDir, 'otie_logs (1).zip'))
      expect(zipBytes.byteLength).toBeGreaterThan(0)
    })

    it('throws when every log fetch fails', async () => {
      vi.mocked(Http.fetch).mockRejectedValue(new Error('network'))

      await expect(
        invoke('downloads:saveLogs', {
          name: 'otie_logs.zip',
          paths: ['/logs/api.log'],
          hostname: 'localhost',
          port: 31950,
          destination: tempDir,
        })
      ).rejects.toThrow('Failed to download any of the requested files.')
    })
  })
})
