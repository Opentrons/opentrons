import { readdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  downloadAuditLog,
  downloadAuditLogs,
  logPeriodDownloadFailed,
  logPeriodDownloadSucceeded,
} from '@opentrons/app/src/redux/audit'

import {
  MISSING_USB_DESTINATION_ERROR,
  registerAudit,
  UNWRITABLE_USB_DESTINATION_ERROR,
} from '..'
import * as Http from '../../http'

import type { Mock } from 'vitest'
import type { Dispatch } from '../../types'

vi.mock('../../http', () => ({
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

describe('app-shell-odd audit module', () => {
  let dispatch: Mock
  let handleAction: Dispatch
  let tempDir: string

  beforeEach(() => {
    tempDir = tempy.directory()
    dispatch = vi.fn()
    handleAction = registerAudit(dispatch)
    vi.mocked(Http.fetchToFile).mockImplementation(
      async (_url, destination) => {
        await writeFile(destination, 'zip-bytes')
        return destination
      }
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('downloads an audit log to the USB destination', async () => {
    handleAction(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        hostname: 'localhost',
        port: 31950,
        destination: tempDir,
      })
    )

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadSucceeded({
          logPeriodId: 'lp-1',
          deletionKey: null,
        })
      )
    })

    await expect(
      readFile(path.join(tempDir, 'logperiod.zip'), 'utf8')
    ).resolves.toBe('zip-bytes')
  })

  it('does not overwrite an existing audit log file with the same name', async () => {
    await writeFile(path.join(tempDir, 'logperiod.zip'), 'original')

    handleAction(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        hostname: 'localhost',
        port: 31950,
        destination: tempDir,
      })
    )

    await vi.waitFor(async () => {
      await expect(
        readFile(path.join(tempDir, 'logperiod (1).zip'), 'utf8')
      ).resolves.toBe('zip-bytes')
    })

    await expect(
      readFile(path.join(tempDir, 'logperiod.zip'), 'utf8')
    ).resolves.toBe('original')
  })

  it('fails when no USB destination is provided', async () => {
    handleAction(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        hostname: 'localhost',
        port: 31950,
      })
    )

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadFailed({
          logPeriodId: 'lp-1',
          error: MISSING_USB_DESTINATION_ERROR,
        })
      )
    })
  })

  it('fails when the USB destination is not writable', async () => {
    handleAction(
      downloadAuditLog({
        logPeriodId: 'lp-1',
        fileName: 'logperiod.zip',
        hostname: 'localhost',
        port: 31950,
        destination: path.join(tempDir, 'missing-usb'),
      })
    )

    await vi.waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        logPeriodDownloadFailed({
          logPeriodId: 'lp-1',
          error: UNWRITABLE_USB_DESTINATION_ERROR,
        })
      )
    })
  })

  it('zips downloaded audit logs into one archive and removes the folder', async () => {
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
        hostname: 'localhost',
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
  })

  it('does not overwrite an existing multi-download zip archive', async () => {
    const existingZipName = 'otie-audit-logs-2024-01-01T00_00_00.000Z.zip'
    await writeFile(path.join(tempDir, existingZipName), 'existing-zip')
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(
      '2024-01-01T00:00:00.000Z'
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
        hostname: 'localhost',
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
