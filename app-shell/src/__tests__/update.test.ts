// app-shell self-update tests
import { EventEmitter } from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UPDATE_VALUE } from '@opentrons/app/src/redux/config'

import * as Cfg from '../config'
import { registerUpdate } from '../update'

import type { Dispatch } from '../types'

type MockedAutoUpdater = EventEmitter & {
  channel: string
  currentVersion: { version: string }
  checkForUpdates: ReturnType<typeof vi.fn>
  downloadUpdate: ReturnType<typeof vi.fn>
  quitAndInstall: ReturnType<typeof vi.fn>
}

vi.mock('electron', () => {
  const app = {
    getPath: () => '',
    whenReady: () => Promise.resolve(undefined),
    on: () => {},
  }

  const shell = {
    openPath: vi.fn(),
    trashItem: vi.fn(),
  }

  const dialog = {
    showOpenDialog: vi.fn(),
  }

  return { app, shell, dialog }
})

let autoUpdater: MockedAutoUpdater
vi.mock('electron-updater', () => {
  const emitter = new EventEmitter() as MockedAutoUpdater
  emitter.channel = 'dev'
  emitter.currentVersion = { version: '0.0.0-mock' }
  emitter.checkForUpdates = vi.fn()
  emitter.downloadUpdate = vi.fn()
  emitter.quitAndInstall = vi.fn()

  return {
    default: { autoUpdater: emitter },
  }
})

vi.mock('../log', () => {
  const fakeLogger = {
    debug: vi.fn(),
    silly: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  return {
    createLogger: () => fakeLogger,
  }
})

vi.mock('../config', () => ({
  getConfig: vi.fn(),
}))

describe('update', () => {
  let dispatch: Dispatch
  let handleAction: Dispatch

  beforeEach(async () => {
    const updaterMod = await import('electron-updater')
    autoUpdater = (updaterMod as any).default.autoUpdater as MockedAutoUpdater
    dispatch = vi.fn()
    handleAction = registerUpdate(dispatch)
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.resetAllMocks()
  })

  it('handles shell:CHECK_UPDATE with available update', () => {
    vi.mocked(Cfg.getConfig).mockReturnValue('dev' as any)
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })

    expect(vi.mocked(Cfg.getConfig)).toHaveBeenCalledWith('update.channel')
    expect(autoUpdater.channel).toEqual('dev')
    expect(autoUpdater.checkForUpdates).toHaveBeenCalledTimes(1)

    autoUpdater.emit('update-available', {
      version: '1.0.0',
    } as any)

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { available: true, info: { version: '1.0.0' } },
    })
  })

  it('handles shell:CHECK_UPDATE with no available update', () => {
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
    vi.mocked(autoUpdater).emit('update-not-available', {
      version: '1.0.0',
    } as any)

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:CHECK_UPDATE_RESULT',
      payload: { available: false, info: { version: '1.0.0' } },
    })
  })

  it('handles shell:CHECK_UPDATE with error', () => {
    handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
    vi.mocked(autoUpdater).emit('error', new Error('AH'))

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

    expect(vi.mocked(autoUpdater).downloadUpdate).toHaveBeenCalledTimes(1)

    const progress: any = {
      percent: 20,
    }

    vi.mocked(autoUpdater).emit('download-progress', progress)

    expect(dispatch).toHaveBeenCalledWith({
      type: 'shell:DOWNLOAD_PERCENTAGE',
      payload: {
        percent: 20,
      },
    })

    vi.mocked(autoUpdater).emit('update-downloaded', {
      version: '1.0.0',
    } as any)

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
    vi.mocked(autoUpdater).emit('error', new Error('AH'))

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
