// app-shell self-update tests
import * as ElectronUpdater from 'electron-updater'
import { UPDATE_VALUE } from '@opentrons/app/src/redux/config'
import { registerUpdate } from '../update'
import * as Cfg from '../config'

import type { Dispatch } from '../types'

jest.unmock('electron-updater')
jest.mock('electron-updater')
jest.mock('../log')
jest.mock('../config')

const getConfig = Cfg.getConfig as jest.MockedFunction<typeof Cfg.getConfig>

const autoUpdater = ElectronUpdater.autoUpdater as jest.Mocked<
  typeof ElectronUpdater.autoUpdater
>

describe('update', () => {
  let dispatch: Dispatch
  let handleAction: Dispatch

  beforeEach(() => {
    dispatch = jest.fn()
    handleAction = registerUpdate(dispatch)
  })

  afterEach(() => {
    jest.resetAllMocks()
    ;(ElectronUpdater as any).__mockReset()
  })

  it('handles shell:CHECK_UPDATE with available update', () => {
    getConfig.mockReturnValue('dev' as any)
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })

    expect(getConfig).toHaveBeenCalledWith('update.channel')
    expect(autoUpdater.channel).toEqual('dev')
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    autoUpdater.emit('update-available', { version: '1.0.0' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { available: true, info: { version: '1.0.0' } },
    })
  })

  it('handles shell:CHECK_UPDATE with no available update', () => {
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
    autoUpdater.emit('update-not-available', { version: '1.0.0' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { available: false, info: { version: '1.0.0' } },
    })
  })

  it('handles shell:CHECK_UPDATE with error', () => {
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
    autoUpdater.emit('error', new Error('AH'))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: {
        error: { name: 'Error', message: 'AH' },
        available: false,
        info: null,
      },
    })
  })

  it('handles shell:DOWNLOAD_UPDATE', () => {
    handleAction({
      type: 'shell:DOWNLOAD_UPDATE',
      meta: { shell: true },
    })

    expect(autoUpdater.downloadUpdate).toHaveBeenCalledTimes(1)

    const progress = {
      percent: 20,
    }

    autoUpdater.emit('download-progress', progress)

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_PERCENTAGE',
      payload: {
        percent: 20,
      },
    })

    autoUpdater.emit('update-downloaded', { version: '1.0.0' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_UPDATE_RESULT',
      payload: {},
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: UPDATE_VALUE,
      payload: { path: 'update.hasJustUpdated', value: true },
      meta: { shell: true },
    })
  })

  it('handles shell:DOWNLOAD_UPDATE with error', () => {
    handleAction({
      type: 'shell:DOWNLOAD_UPDATE',
      meta: { shell: true },
    })
    autoUpdater.emit('error', new Error('AH'))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_UPDATE_RESULT',
      payload: { error: { name: 'Error', message: 'AH' } },
    })
  })

  it('handles shell:APPLY_UPDATE', () => {
    handleAction({ type: 'shell:APPLY_UPDATE', meta: { shell: true } })
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledTimes(1)
  })
})
