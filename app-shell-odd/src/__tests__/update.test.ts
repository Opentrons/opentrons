// app-shell self-update tests
import { when, resetAllWhenMocks } from 'jest-when'
import * as http from '../http'
import { registerUpdate, FLEX_MANIFEST_URL } from '../update'
import * as Cfg from '../config'

import type { Dispatch } from '../types'

jest.unmock('electron-updater')
jest.mock('electron-updater')
jest.mock('../log')
jest.mock('../config')
jest.mock('../http')
jest.mock('fs-extra')

const getConfig = Cfg.getConfig as jest.MockedFunction<typeof Cfg.getConfig>
const fetchJson = http.fetchJson as jest.MockedFunction<typeof http.fetchJson>

describe('update', () => {
  let dispatch: Dispatch
  let handleAction: Dispatch

  beforeEach(() => {
    dispatch = jest.fn()
    handleAction = registerUpdate(dispatch)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('handles shell:CHECK_UPDATE with available update', () => {
    when(getConfig)
      // @ts-expect-error getConfig mock not recognizing correct type overload
      .calledWith('update')
      .mockReturnValue({
        channel: 'latest',
      } as any)

    when(fetchJson)
      .calledWith(FLEX_MANIFEST_URL)
      .mockResolvedValue({ production: { '5.0.0': {}, '6.0.0': {} } })
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })

    expect(getConfig).toHaveBeenCalledWith('update')

    expect(fetchJson).toHaveBeenCalledWith(FLEX_MANIFEST_URL)
  })
})
