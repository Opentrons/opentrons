import { readdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { dialog } from 'electron'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeAuditLogDirectory,
  downloadAuditLog,
  downloadAuditLogs,
  logPeriodDownloadCanceled,
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '@opentrons/app/src/redux/audit'

import { AUDIT_LOG_DIRECTORY_CONFIG_PATH, registerAudit } from '..'
import * as Cfg from '../../config'
import { OPENTRONS_USB } from '../../constants'
import * as Dialogs from '../../dialogs'
import * as Http from '../../http'
import { getSerialPortHttpAgent } from '../../usb'

import type { BrowserWindow } from 'electron'
import type { Response } from 'node-fetch'
import type { Mock } from 'vitest'
import type { Config } from '@opentrons/app/src/redux/config/types'
import type { Dispatch } from '../../types'

vi.mock('../../config', () => ({
  getFullConfig: vi.fn(),
}))
vi.mock('../../dialogs', () => ({
  showOpenDirectoryDialog: vi.fn(),
}))
vi.mock('../../http', () => ({
  fetchToFile: vi.fn(),
}))
// factory mock so the real module (and its serialport dependency) never loads
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
  dialog: {
    showOpenDialog: vi.fn(),
  },
}))

const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

const downloadPayload = {
  logPeriodId: 'lp-1',
  fileName: 'logperiod.zip',
  hostname: '192.168.1.100',
  port: 31950,
}

const mockShowOpenDialogCanceled = {
  canceled: true,
  filePaths: [],
}

describe('audit module dispatches', () => {
  const mockMainWindow = {
    browserWindow: true,
  } as unknown as BrowserWindow
  let dispatch: Mock
  let handleAction: Dispatch
  let tempDir: string

  beforeEach(() => {
    tempDir = tempy.directory()
    vi.mocked(Cfg.getFullConfig).mockReturnValue({
      audit: { logDirectory: tempDir },
    } as Config)
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([])
    vi.mocked(dialog.showOpenDialog).mockResolvedValue(
      mockShowOpenDialogCanceled
    )
    vi.mocked(Http.fetchToFile).mockResolvedValue(
      path.join(tempDir, 'logperiod.zip')
    )
    dispatch = vi.fn()
    handleAction = registerAudit(dispatch, mockMainWindow)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the directory dialog at the configured location', () => {
    handleAction(changeAuditLogDirectory())

    expect(vi.mocked(Dialogs.showOpenDirectoryDialog)).toHaveBeenCalledWith(
      mockMainWindow,
      {
        defaultPath: tempDir,
        properties: ['openDirectory', 'createDirectory'],
      }
    )
  })

  it('updates config when a directory is selected', async () => {
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/new/audit-logs',
    ])

    handleAction(changeAuditLogDirectory())
    await flush()

    expect(dispatch).toHaveBeenCalledWith({
      type: 'config:UPDATE_VALUE',
      payload: {
        path: AUDIT_LOG_DIRECTORY_CONFIG_PATH,
        value: '/new/audit-logs',
      },
      meta: { shell: true },
    })
  })

  it('does not update config when the dialog is canceled', async () => {
    handleAction(changeAuditLogDirectory())
    await flush()

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches canceled when the download directory dialog is canceled', async () => {
    handleAction(downloadAuditLog(downloadPayload))
    await flush()

    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadCanceled({ logPeriodId: 'lp-1' })
    )
    expect(Http.fetchToFile).not.toHaveBeenCalled()
  })

  it('downloads the audit log and reports success with deletion key', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [tempDir],
    } as any)
    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination, options) => {
        options?.onResponse?.({
          headers: {
            get: (name: string) =>
              name === 'opentrons-log-period-deletion-key'
                ? 'deletion-key-1'
                : null,
          },
        } as unknown as Response)
        await writeFile(destination, 'zip-bytes')
        return destination
      }
    )

    handleAction(downloadAuditLog(downloadPayload))

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadSucceeded({
          logPeriodId: 'lp-1',
          deletionKey: 'deletion-key-1',
        })
      )
    })

    expect(Http.fetchToFile).toHaveBeenCalledWith(
      'http://192.168.1.100:31950/audit/external/logPeriods/lp-1/download',
      path.join(tempDir, 'logperiod.zip'),
      expect.objectContaining({ onResponse: expect.any(Function) })
    )
  })

  it('does not overwrite an existing audit log file with the same name', async () => {
    await writeFile(path.join(tempDir, 'logperiod.zip'), 'original')
    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination) => {
        await writeFile(destination, 'new-bytes')
        return destination
      }
    )

    handleAction(downloadAuditLog({ ...downloadPayload, destination: tempDir }))
    await vi.waitFor(async () => {
      await expect(
        readFile(path.join(tempDir, 'logperiod (1).zip'), 'utf8')
      ).resolves.toBe('new-bytes')
    })

    await expect(
      readFile(path.join(tempDir, 'logperiod.zip'), 'utf8')
    ).resolves.toBe('original')
    expect(Http.fetchToFile).toHaveBeenCalledWith(
      expect.any(String),
      path.join(tempDir, 'logperiod (1).zip'),
      expect.any(Object)
    )
  })

  it('routes over the serial port agent for a USB host', async () => {
    const mockAgent = { usbAgent: true }
    vi.mocked(getSerialPortHttpAgent).mockReturnValue(mockAgent as any)
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [tempDir],
    } as any)

    handleAction(
      downloadAuditLog({ ...downloadPayload, hostname: OPENTRONS_USB })
    )

    await vi.waitFor(() => {
      expect(Http.fetchToFile).toHaveBeenCalledWith(
        `http://${OPENTRONS_USB}:31950/audit/external/logPeriods/lp-1/download`,
        path.join(tempDir, 'logperiod.zip'),
        expect.objectContaining({ requestInit: { agent: mockAgent } })
      )
    })
  })

  it('dispatches success without a deletion key for in-progress periods', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [tempDir],
    } as any)
    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination, options) => {
        options?.onResponse?.({
          headers: {
            get: () => null,
          },
        } as unknown as Response)
        return destination
      }
    )

    handleAction(downloadAuditLog(downloadPayload))

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadSucceeded({
          logPeriodId: 'lp-1',
          deletionKey: null,
        })
      )
    })
  })

  it('dispatches failure when the download fails', async () => {
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [tempDir],
    } as any)
    vi.mocked(Http.fetchToFile).mockRejectedValue(new Error('network error'))

    handleAction(downloadAuditLog(downloadPayload))

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadFailed({
          logPeriodId: 'lp-1',
          error: 'network error',
        })
      )
    })
  })

  it('zips multiple audit logs into one archive and removes the folder', async () => {
    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination) => {
        await writeFile(destination, 'zip-bytes')
        return destination
      }
    )

    handleAction(
      downloadAuditLogs({
        logPeriodSummaries: [
          {
            id: 'lp-1',
            startedAt: '2024-01-01T00:00:00Z',
            endedAt: '2024-01-01T01:00:00Z',
          },
          {
            id: 'lp-2',
            startedAt: '2024-01-02T00:00:00Z',
            endedAt: '2024-01-02T01:00:00Z',
          },
        ],
        robotName: 'otie',
        hostname: '192.168.1.100',
        port: 31950,
        destination: tempDir,
      })
    )

    await vi.waitFor(async () => {
      const entries = await readdir(tempDir, { withFileTypes: true })
      expect(entries).toHaveLength(1)
      expect(entries[0]?.isFile()).toBe(true)
      expect(entries[0]?.name).toMatch(/^otie-audit-logs-.*\.zip$/)
    })

    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-1',
        deletionKey: null,
      })
    )
    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-2',
        deletionKey: null,
      })
    )
  })

  it('does not overwrite an existing multi-download zip archive', async () => {
    const existingZipName = 'otie-audit-logs-2024-01-01T00_00_00.000Z.zip'
    await writeFile(path.join(tempDir, existingZipName), 'existing-zip')
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
      '2024-01-01T00:00:00.000Z'
    )

    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination) => {
        await writeFile(destination, 'zip-bytes')
        return destination
      }
    )

    handleAction(
      downloadAuditLogs({
        logPeriodSummaries: [
          {
            id: 'lp-1',
            startedAt: '2024-01-01T00:00:00Z',
            endedAt: '2024-01-01T01:00:00Z',
          },
          {
            id: 'lp-2',
            startedAt: '2024-01-02T00:00:00Z',
            endedAt: '2024-01-02T01:00:00Z',
          },
        ],
        robotName: 'otie',
        hostname: '192.168.1.100',
        port: 31950,
        destination: tempDir,
      })
    )

    await vi.waitFor(async () => {
      const entries = await readdir(tempDir)
      expect(entries).toContain(
        'otie-audit-logs-2024-01-01T00_00_00.000Z (1).zip'
      )
    })

    await expect(
      readFile(path.join(tempDir, existingZipName), 'utf8')
    ).resolves.toBe('existing-zip')
  })
})
