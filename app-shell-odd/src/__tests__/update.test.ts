// app-shell self-update tests
import { when } from 'vitest-when'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import * as http from '../http'
import { registerUpdate, FLEX_MANIFEST_URL } from '../update'
import * as Cfg from '../config'

import type { Dispatch } from '../types'

vi.unmock('electron-updater')
vi.mock('electron-updater')
vi.mock('../log')
vi.mock('../config')
vi.mock('../http')
vi.mock('fs-extra')

describe('update', () => {
  let dispatch: Dispatch
  let handleAction: Dispatch

  beforeEach(() => {
    dispatch = vi.fn()
    handleAction = registerUpdate(dispatch)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('handles shell:CHECK_UPDATE with available update', () => {
    when(vi.mocked(Cfg.getConfig))
      // @ts-expect-error getConfig mock not recognizing correct type overload
      .calledWith('update')
      .thenReturn({
        channel: 'latest',
      } as any)

    when(vi.mocked(http.fetchJson))
      .calledWith(FLEX_MANIFEST_URL)
      .thenResolve({ production: { '5.0.0': {}, '6.0.0': {} } })
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })

    expect(vi.mocked(Cfg.getConfig)).toHaveBeenCalledWith('update')

    expect(vi.mocked(http.fetchJson)).toHaveBeenCalledWith(FLEX_MANIFEST_URL)
  })
})
