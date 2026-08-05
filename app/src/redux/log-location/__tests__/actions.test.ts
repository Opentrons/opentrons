import { describe, expect, it } from 'vitest'

import { changeAuditLogDirectory } from '../actions'

describe('log location actions', () => {
  it('creates an action to request an audit log directory change', () => {
    expect(changeAuditLogDirectory()).toEqual({
      type: 'log-location:CHANGE_AUDIT_LOG_DIRECTORY',
      meta: { shell: true },
    })
  })
})
