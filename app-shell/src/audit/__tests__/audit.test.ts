import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changeAuditLogDirectory,
  downloadAuditLog,
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

const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

const downloadPayload = {
  logPeriodId: 'lp-1',
  fileName: 'logperiod.zip',
  hostname: '192.168.1.100',
  port: 31950,
}

describe('audit module dispatches', () => {
  const mockMainWindow = {
    browserWindow: true,
  } as unknown as BrowserWindow
  let dispatch: Mock
  let handleAction: Dispatch

  beforeEach(() => {
    vi.mocked(Cfg.getFullConfig).mockReturnValue({
      audit: { logDirectory: '/existing/audit-logs' },
    } as Config)
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([])
    vi.mocked(Http.fetchToFile).mockResolvedValue(
      path.join('existing', 'audit-logs', 'logperiod.zip')
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
        defaultPath: '/existing/audit-logs',
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
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/existing/audit-logs',
    ])
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
        return destination
      }
    )

    handleAction(downloadAuditLog(downloadPayload))
    await flush()

    expect(Http.fetchToFile).toHaveBeenCalledWith(
      'http://192.168.1.100:31950/audit/external/logPeriods/lp-1/download',
      path.join('existing', 'audit-logs', 'logperiod.zip'),
      expect.objectContaining({ onResponse: expect.any(Function) })
    )
    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadSucceeded({
        logPeriodId: 'lp-1',
        deletionKey: 'deletion-key-1',
      })
    )
  })

  it('routes over the serial port agent for a USB host', async () => {
    const mockAgent = { usbAgent: true }
    vi.mocked(getSerialPortHttpAgent).mockReturnValue(mockAgent as any)
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/existing/audit-logs',
    ])

    handleAction(
      downloadAuditLog({ ...downloadPayload, hostname: OPENTRONS_USB })
    )
    await flush()

    expect(Http.fetchToFile).toHaveBeenCalledWith(
      `http://${OPENTRONS_USB}:31950/audit/external/logPeriods/lp-1/download`,
      path.join('existing', 'audit-logs', 'logperiod.zip'),
      expect.objectContaining({ requestInit: { agent: mockAgent } })
    )
  })

  it('dispatches failure when the download response is missing a deletion key', async () => {
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/existing/audit-logs',
    ])
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
    await flush()

    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadFailed({
        logPeriodId: 'lp-1',
        error: 'Missing deletion key in download response',
      })
    )
  })

  it('dispatches failure when the download fails', async () => {
    vi.mocked(Dialogs.showOpenDirectoryDialog).mockResolvedValue([
      '/existing/audit-logs',
    ])
    vi.mocked(Http.fetchToFile).mockRejectedValue(new Error('network error'))

    handleAction(downloadAuditLog(downloadPayload))
    await flush()

    expect(dispatch).toHaveBeenCalledWith(
      logPeriodDownloadFailed({
        logPeriodId: 'lp-1',
        error: 'network error',
      })
    )
  })
})
