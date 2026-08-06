import { describe, expect, it } from 'vitest'

import { changeAuditLogDirectory, downloadAuditLog } from '../actions'

import type { DownloadAuditLogPayload } from '../types'

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
      host: {
        hostname: '192.168.1.100',
        port: 31950,
        token: 'mock-token',
      },
    }

    expect(downloadAuditLog(payload)).toEqual({
      type: 'audit:DOWNLOAD_AUDIT_LOG',
      payload,
      meta: { shell: true },
    })
  })
})
