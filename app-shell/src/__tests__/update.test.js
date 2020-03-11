// app-shell self-update tests
import {
  autoUpdater,
  __mockReset as __updaterMockReset,
} from 'electron-updater'
import { registerUpdate } from '../update'
import { getConfig } from '../config'

jest.mock('electron-updater')
jest.mock('../log')
jest.mock('../config')

describe('update', () => {
  let dispatch
  let handleAction

  beforeEach(() => {
    dispatch = jest.fn()
    handleAction = registerUpdate(dispatch)
  })

  afterEach(() => {
    jest.clearAllMocks()
    __updaterMockReset()
  })

  it('handles shell:CHECK_UPDATE with available update', () => {
    getConfig.mockReturnValue('dev')
    handleAction({ type: 'shell:CHECK_UPDATE' })

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
    handleAction({ type: 'shell:CHECK_UPDATE' })
    autoUpdater.emit('update-not-available', { version: '1.0.0' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { available: false, info: { version: '1.0.0' } },
    })
  })

  it('handles shell:CHECK_UPDATE with error', () => {
    handleAction({ type: 'shell:CHECK_UPDATE' })
    autoUpdater.emit('error', new Error('AH'))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { error: { name: 'Error', message: 'AH' } },
    })
  })

  it('handles shell:DOWNLOAD_UPDATE', () => {
    handleAction({ type: 'shell:DOWNLOAD_UPDATE' })

    expect(autoUpdater.downloadUpdate).toHaveBeenCalledTimes(1)

    autoUpdater.emit('update-downloaded', { version: '1.0.0' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_UPDATE_RESULT',
      payload: {},
    })
  })

  it('handles shell:DOWNLOAD_UPDATE with error', () => {
    handleAction({ type: 'shell:DOWNLOAD_UPDATE' })
    autoUpdater.emit('error', new Error('AH'))

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_UPDATE_RESULT',
      payload: { error: { name: 'Error', message: 'AH' } },
    })
  })

  it('handles shell:APPLY_UPDATE', () => {
    handleAction({ type: 'shell:APPLY_UPDATE' })
    expect(autoUpdater.quitAndInstall).toHaveBeenCalledTimes(1)
  })
})
