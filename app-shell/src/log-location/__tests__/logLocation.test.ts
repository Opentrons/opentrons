import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { changeAuditLogDirectory } from '@opentrons/app/src/redux/log-location'

import { AUDIT_LOG_DIRECTORY_CONFIG_PATH, registerLogLocation } from '..'
import * as Cfg from '../../config'
import * as Dialogs from '../../dialogs'

import type { BrowserWindow } from 'electron'
import type { Mock } from 'vitest'
import type { Config } from '@opentrons/app/src/redux/config/types'
import type { Dispatch } from '../../types'

vi.mock('../../config', () => ({
  getFullConfig: vi.fn(),
}))
vi.mock('../../dialogs', () => ({
  showOpenDirectoryDialog: vi.fn(),
}))

const flush = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('log location module dispatches', () => {
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
    dispatch = vi.fn()
    handleAction = registerLogLocation(dispatch, mockMainWindow)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('opens the directory dialog at the configured location', () => {
    handleAction(changeAuditLogDirectory())

    expect(vi.mocked(Dialogs.showOpenDirectoryDialog)).toHaveBeenCalledWith(
      mockMainWindow,
      { defaultPath: '/existing/audit-logs' }
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
})
