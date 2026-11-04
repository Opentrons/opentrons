import { describe, expect, it } from 'vitest'

import {
  changeAuditLogDirectory,
  downloadAuditLog,
  downloadAuditLogs,
} from '../actions'

import type {
  DownloadAuditLogPayload,
  DownloadAuditLogsPayload,
} from '../types'

describe('audit actions', () => {
  it('creates an action to request an audit log directory change', () => {
    expect(changeAuditLogDirectory()).toEqual({
      type: 'audit:CHANGE_AUDIT_LOG_DIRECTORY',
      meta: { shell: true },
    })
  })

  it('creates an action to download an audit log to a given location', () => {
    const payload: DownloadAuditLogPayload = {
      logPeriodId: 'log-period-1',
      fileName: 'logperiod.zip',
      hostname: '192.168.1.100',
      port: 31950,
    }

    expect(downloadAuditLog(payload)).toEqual({
      type: 'audit:DOWNLOAD_AUDIT_LOG',
      payload,
      meta: { shell: true },
    })
  })

  it('creates an action to download multiple audit logs', () => {
    const payload: DownloadAuditLogsPayload = {
      logPeriodSummaries: [
        {
          id: 'log-period-1',
          startedAt: '2024-01-01T10:00:00.000Z',
          endedAt: null,
        },
      ],
      hostname: '192.168.1.100',
      port: 31950,
      robotName: 'otie',
      destination: '/mnt/usb',
    }

    expect(downloadAuditLogs(payload)).toEqual({
      type: 'audit:DOWNLOAD_AUDIT_LOGS',
      payload,
      meta: { shell: true },
    })
  })
})
