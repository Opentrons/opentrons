import { describe, expect, it } from 'vitest'

import { getAuditLogDirectory } from '../selectors'

import type { State } from '/app/redux/types'

describe('log location selectors', () => {
  it('returns the configured audit log directory', () => {
    const state: State = {
      config: { audit: { logDirectory: '/mock/audit-log-path' } },
    } as any

    expect(getAuditLogDirectory(state)).toEqual('/mock/audit-log-path')
  })

  it('returns null when no audit log directory is configured', () => {
    const state: State = {
      config: { audit: { logDirectory: null } },
    } as any

    expect(getAuditLogDirectory(state)).toEqual(null)
  })

  it('returns null when config is unknown', () => {
    const state: State = { config: null } as any

    expect(getAuditLogDirectory(state)).toEqual(null)
  })
})
