// app-shell self-update tests
import { rm } from 'fs-extra'
import tempy from 'tempy'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import * as Cfg from '../../config'
import { CONFIG_INITIALIZED, VALUE_UPDATED } from '../../constants'
import { FLEX_MANIFEST_URL } from '../constants'
import { getSystemUpdateDir as _getSystemUpdateDir } from '../directories'
import { getProvider as _getUsbProvider } from '../from-usb'
import { getProvider as _getWebProvider } from '../from-web'
import {
  createUpdateDriver,
  CURRENT_SYSTEM_VERSION,
  manageDriver,
} from '../handler'

import type {
  ConfigInitializedAction,
  ConfigValueUpdatedAction,
} from '@opentrons/app/src/redux/config'
import type { Dispatch } from '../../types'
import type { USBUpdateSource } from '../from-usb'
import type { WebUpdateSource } from '../from-web'
import type { UpdateDriver } from '../handler'
import type { UpdateProvider } from '../types'

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

vi.mock('../../log', () => {
  const fakeLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  return {
    createLogger: () => fakeLogger,
  }
})

vi.mock('../../config', () => ({
  getFullConfig: vi.fn(),
  getConfig: vi.fn(),
  handleConfigChange: vi.fn(),
}))
vi.mock('../../http')
vi.mock('../directories')
vi.mock('../from-web')
vi.mock('../from-usb')

const getSystemUpdateDir = vi.mocked(_getSystemUpdateDir)
const getConfig = vi.mocked(Cfg.getConfig)
const getWebProvider = vi.mocked(_getWebProvider)
const getUsbProvider = vi.mocked(_getUsbProvider)

describe('update driver manager', () => {
  let dispatch: Dispatch
  let testDir: string = ''
  beforeEach(() => {
    const thisTd = tempy.directory()
    testDir = thisTd
    dispatch = vi.fn()
    when(getSystemUpdateDir).calledWith().thenReturn(thisTd)
  })

  afterEach(() => {
    vi.resetAllMocks()
    const oldTd = testDir
    testDir = ''
    return oldTd === ''
      ? new Promise<void>(resolve => resolve())
      : rm(oldTd, { recursive: true, force: true })
  })

  it('creates a driver once config is loaded', () => {
    when(getConfig)
      .calledWith('update')
      .thenReturn({
        channel: 'alpha',
        automaticallyDownloadUpdates: true,
      } as any as Cfg.Config['update'])
    const webDriverPayload = {
      manifestUrl: FLEX_MANIFEST_URL,
      channel: 'alpha',
      updateCacheDirectory: testDir,
      currentVersion: CURRENT_SYSTEM_VERSION,
    } as WebUpdateSource
    const mockCleanup = vi.fn() as () => Promise<void>
    when(getWebProvider)
      .calledWith(webDriverPayload)
      .thenReturn({
        source: () => webDriverPayload,
        cleanup: mockCleanup,
      } as UpdateProvider<WebUpdateSource>)
    const driver = manageDriver(dispatch)
    let wrappedDriver: null | UpdateDriver = null
    expect(driver.getUpdateDriver()).toBeNull()
    expect(getConfig).not.toHaveBeenCalled()
    return driver
      .handleAction({
        type: CONFIG_INITIALIZED,
      } as ConfigInitializedAction)
      .then(() => {
        wrappedDriver = driver.getUpdateDriver()
        expect(wrappedDriver).not.toBeNull()
        expect(getConfig).toHaveBeenCalledOnce()
        expect(getWebProvider).toHaveBeenCalledWith(webDriverPayload)
        expect(mockCleanup).toHaveBeenCalled()
      })
      .then(() =>
        driver.handleAction({
          type: CONFIG_INITIALIZED,
        } as ConfigInitializedAction)
      )
      .then(() => {
        expect(wrappedDriver).toBe(driver.getUpdateDriver())
      })
  })

  it('reloads the web driver when appropriate', () => {
    when(getConfig)
      .calledWith('update')
      .thenReturn({
        channel: 'alpha',
        automaticallyDownloadUpdates: true,
      } as any as Cfg.Config['update'])
    const fakeProvider = {
      teardown: vi.fn(),
      scanUpdate: vi.fn(),
      downloadUpdate: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: vi.fn(),
      source: () => ({ channel: 'alpha' }) as any as WebUpdateSource,
      cleanup: () => Promise.resolve(),
      ongoingCheck: () => null,
    }
    const fakeProvider2 = {
      ...fakeProvider,
      source: () => ({ channel: 'beta' }) as any as WebUpdateSource,
    }
    when(getWebProvider)
      .calledWith({
        manifestUrl: FLEX_MANIFEST_URL,
        channel: 'alpha',
        updateCacheDirectory: testDir,
        currentVersion: CURRENT_SYSTEM_VERSION,
      })
      .thenReturn(fakeProvider)
    when(getWebProvider)
      .calledWith({
        manifestUrl: FLEX_MANIFEST_URL,
        channel: 'beta',
        updateCacheDirectory: testDir,
        currentVersion: CURRENT_SYSTEM_VERSION,
      })
      .thenReturn(fakeProvider2)
    const driverManager = manageDriver(dispatch)
    return driverManager
      .handleAction({
        type: CONFIG_INITIALIZED,
      } as ConfigInitializedAction)
      .then(() => {
        expect(getWebProvider).toHaveBeenCalledWith({
          manifestUrl: FLEX_MANIFEST_URL,
          channel: 'alpha',
          updateCacheDirectory: testDir,
          currentVersion: CURRENT_SYSTEM_VERSION,
        })
        expect(driverManager.getUpdateDriver()).not.toBeNull()
        when(fakeProvider.teardown).calledWith().thenResolve()
        return driverManager.handleAction({
          type: VALUE_UPDATED,
        } as ConfigValueUpdatedAction)
      })
      .then(() => {
        expect(getWebProvider).toHaveBeenCalledOnce()
        when(getConfig)
          .calledWith('update')
          .thenReturn({
            channel: 'beta',
            automaticallyDownloadUpdates: true,
          } as any as Cfg.Config['update'])
        return driverManager.handleAction({
          type: VALUE_UPDATED,
        } as ConfigValueUpdatedAction)
      })
      .then(() => {
        expect(getWebProvider).toHaveBeenCalledWith({
          manifestUrl: FLEX_MANIFEST_URL,
          channel: 'alpha',
          updateCacheDirectory: testDir,
          currentVersion: CURRENT_SYSTEM_VERSION,
        })
      })
  })
})

describe('update driver', () => {
  let dispatch: Dispatch
  let testDir: string = ''
  let subject: UpdateDriver | null = null
  const fakeProvider: UpdateProvider<WebUpdateSource> = {
    teardown: vi.fn(),
    scanUpdate: vi.fn(),
    downloadUpdate: vi.fn(),
    getUpdateDetails: vi.fn(),
    lockUpdateCache: vi.fn(),
    unlockUpdateCache: vi.fn(),
    name: vi.fn(),
    source: () => ({ channel: 'alpha' }) as any as WebUpdateSource,
    cleanup: () => Promise.resolve(),
    ongoingCheck: () => null,
  }
  const fakeUsbProviders: Record<string, UpdateProvider<USBUpdateSource>> = {
    first: {
      teardown: vi.fn(),
      scanUpdate: vi.fn(),
      downloadUpdate: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/usb/path',
      source: () =>
        ({
          massStorageRootPath: '/some/usb/path',
        }) as any as USBUpdateSource,
      cleanup: () => Promise.resolve(),
      ongoingCheck: () => null,
    },
  }

  beforeEach(() => {
    const thisTd = tempy.directory()
    testDir = thisTd
    dispatch = vi.fn()
    when(getSystemUpdateDir).calledWith().thenReturn(thisTd)
    when(getConfig)
      .calledWith('update')
      .thenReturn({
        channel: 'alpha',
        automaticallyDownloadUpdates: true,
      } as any as Cfg.Config['update'])
    when(getWebProvider)
      .calledWith({
        manifestUrl: FLEX_MANIFEST_URL,
        channel: 'alpha',
        updateCacheDirectory: testDir,
        currentVersion: CURRENT_SYSTEM_VERSION,
      })
      .thenReturn(fakeProvider)
    fakeUsbProviders.first = {
      teardown: vi.fn(),
      scanUpdate: vi.fn(),
      downloadUpdate: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/usb/path',
      source: () =>
        ({
          massStorageRootPath: '/some/usb/path',
        }) as any as USBUpdateSource,
      cleanup: () => Promise.resolve(),
      ongoingCheck: () => null,
    }
    fakeUsbProviders.second = {
      teardown: vi.fn(),
      scanUpdate: vi.fn(),
      downloadUpdate: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/other/usb/path',
      source: () =>
        ({
          massStorageRootPath: '/some/other/usb/path',
        }) as any as USBUpdateSource,
      cleanup: () => Promise.resolve(),
      ongoingCheck: () => null,
    }
    subject = createUpdateDriver(dispatch)
  })

  afterEach(() => {
    vi.resetAllMocks()
    const oldTd = testDir
    testDir = ''
    return (
      subject?.teardown() || new Promise<void>(resolve => resolve())
    ).then(() =>
      oldTd === ''
        ? new Promise<void>(resolve => resolve())
        : rm(oldTd, { recursive: true, force: true })
    )
  })

  it('checks updates when told to check updates and autodownloads if the setting is set', () => {
    const thisSubject = subject!
    when(getConfig)
      .calledWith('update')
      .thenReturn({ automaticallyDownloadUpdates: true })
    when(fakeProvider.scanUpdate)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
            resolve({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
          })
      )
    return thisSubject
      .handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            version: '1.2.3',
            releaseNotes: null,
            force: false,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '1.2.3', force: false, target: 'flex' },
        })
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:DOWNLOAD_UPDATE',
          meta: { shell: true },
        })
      })
  })
  it('checks updates when told to check updates and does not autodownload if the setting is set', () => {
    const thisSubject = subject!
    when(getConfig).calledWith('update').thenReturn(false)
    when(fakeProvider.scanUpdate)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
            resolve({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
          })
      )
    return thisSubject
      .handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            version: '1.2.3',
            releaseNotes: null,
            force: false,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '1.2.3', force: false, target: 'flex' },
        })
        expect(dispatch).not.toHaveBeenCalledWith({
          type: 'robotUpdate:DOWNLOAD_UPDATE',
          meta: { shell: true },
        })
      })
  })
  it('does not clear update data if a scan fails because a check is ongoing', async () => {
    const thisSubject = subject!
    when(getConfig)
      .calledWith('update')
      .thenReturn({ automaticallyDownloadUpdates: false })
    when(fakeProvider.scanUpdate)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: '1.2.3',
              files: {
                system: null,
                releaseNotes: '/some/path/to/releasenotes.md',
              },
              downloadProgress: 0,
              releaseNotes: 'hello',
            })
            resolve({
              version: '1.2.3',
              files: {
                system: null,
                releaseNotes: '/some/path/to/releasenotes.md',
              },
              downloadProgress: 0,
              releaseNotes: 'hello',
            })
          })
      )
    await thisSubject.handleAction({
      type: 'shell:CHECK_UPDATE',
      meta: { shell: true },
    })
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'robotUpdate:UPDATE_VERSION',
      payload: { version: '1.2.3', force: false, target: 'flex' },
    })
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'robotUpdate:UPDATE_INFO',
      payload: {
        version: '1.2.3',
        force: false,
        target: 'flex',
        releaseNotes: 'hello',
      },
    })
    when(fakeProvider.scanUpdate)
      .calledWith(expect.any(Function))
      .thenReject(new Error('ongoing'))
    await thisSubject.handleAction({
      type: 'shell:CHECK_UPDATE',
      meta: { shell: true },
    })
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      type: 'robotUpdate:UPDATE_VERSION',
      payload: {
        version: '1.2.3',
        force: false,
        target: 'flex',
      },
    })
    expect(dispatch).toHaveBeenNthCalledWith(4, {
      type: 'robotUpdate:UPDATE_INFO',
      payload: {
        version: '1.2.3',
        force: false,
        target: 'flex',
        releaseNotes: 'hello',
      },
    })
    expect(dispatch).not.toHaveBeenCalledWith({
      type: 'robotUpdate:UPDATE_VERSION',
      payload: { version: null, force: false, target: 'flex' },
    })
  })
  it('downloads updates when told and no USB updates are present and updates are on', () => {
    when(getConfig)
      .calledWith('update')
      .thenReturn({ automaticallyDownloadUpdates: true })
    const thisSubject = subject!
    when(fakeProvider.downloadUpdate)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: null,
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
            progress({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 0,
              releaseNotes: null,
            })
            progress({
              version: '1.2.3',
              files: { system: null, releaseNotes: null },
              downloadProgress: 50,
              releaseNotes: null,
            })
            progress({
              version: '1.2.3',
              files: {
                system: '/some/path',
                releaseNotes: '/some/other/path',
              },
              downloadProgress: 100,
              releaseNotes: 'some release notes',
            })
            resolve({
              version: '1.2.3',
              files: {
                system: '/some/path',
                releaseNotes: '/some/other/path',
              },
              downloadProgress: 100,
              releaseNotes: 'some release notes',
            })
          })
      )
    return thisSubject
      .handleAction({
        type: 'robotUpdate:DOWNLOAD_UPDATE',
        meta: { shell: true },
      })
      .then(() => {
        expect(dispatch).toHaveBeenNthCalledWith(1, {
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '1.2.3', force: false, target: 'flex' },
        })
        expect(dispatch).toHaveBeenNthCalledWith(2, {
          type: 'robotUpdate:DOWNLOAD_PROGRESS',
          payload: { progress: 50, target: 'flex' },
        })
        expect(dispatch).toHaveBeenNthCalledWith(3, {
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            version: '1.2.3',
            releaseNotes: 'some release notes',
            force: false,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenNthCalledWith(4, {
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '1.2.3', force: false, target: 'flex' },
        })
        expect(dispatch).toHaveBeenNthCalledWith(5, {
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            version: '1.2.3',
            releaseNotes: 'some release notes',
            force: false,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenNthCalledWith(6, {
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '1.2.3', force: false, target: 'flex' },
        })
      })
  })
  it('creates a usb provider when it gets a message that a usb device was added', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
      })
  })
  it('does not create a usb provider if it already has one for a path', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '0.1.2',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.first.getUpdateDetails)
      .calledWith()
      .thenReturn({
        version: '0.1.2',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
        return thisSubject.handleAction({
          type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
          payload: {
            rootPath: '/some/usb/path',
            filePaths: ['/some/file', '/some/other/file'],
          },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledOnce()
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            releaseNotes: 'some fake notes',
            version: '0.1.2',
            force: true,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_VERSION',
          payload: {
            version: '0.1.2',
            force: true,
            target: 'flex',
          },
        })
      })
      .then(() => {
        vi.mocked(dispatch).mockReset()
        return thisSubject.handleAction({
          type: 'robotUpdate:READ_SYSTEM_FILE',
          payload: { target: 'flex' },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:FILE_INFO',
          payload: {
            systemFile: '/some/file',
            version: '0.1.2',
            isManualFile: false,
          },
        })
      })
  })
  it('tears down a usb provider when it is removed', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
        when(fakeUsbProviders.first.teardown).calledWith().thenResolve()
        return thisSubject.handleAction({
          type: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED',
          payload: { rootPath: '/some/usb/path' },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(fakeUsbProviders.first.teardown).toHaveBeenCalledOnce()
      })
  })
  it('re-adds a usb provider if it is inserted after being removed', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
        when(fakeUsbProviders.first.teardown).calledWith().thenResolve()
        return thisSubject.handleAction({
          type: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED',
          payload: { rootPath: '/some/usb/path' },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(fakeUsbProviders.first.teardown).toHaveBeenCalledOnce()
        return thisSubject.handleAction({
          type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
          payload: {
            rootPath: '/some/usb/path',
            filePaths: ['/some/file', '/some/other/file'],
          },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledTimes(2)
      })
  })
  it('prefers usb updates to web updates', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.getUpdateDetails)
      .calledWith()
      .thenReturn({
        version: '0.1.2',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '0.1.2',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeProvider.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: {
          system: '/some/file/from/the/web',
          releaseNotes: null,
        },
        releaseNotes: 'some other notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() =>
        thisSubject.handleAction({
          type: 'shell:CHECK_UPDATE',
          meta: { shell: true },
        })
      )
      .then(() => {
        expect(dispatch).toHaveBeenLastCalledWith({
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: '0.1.2', force: true, target: 'flex' },
        })
      })
      .then(() => {
        vi.mocked(dispatch).mockReset()
        return thisSubject.handleAction({
          type: 'robotUpdate:READ_SYSTEM_FILE',
          payload: { target: 'flex' },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:FILE_INFO',
          payload: {
            systemFile: '/some/file',
            version: '0.1.2',
            isManualFile: false,
          },
        })
      })
  })
  it('selects the highest version usb update', () => {
    const thisSubject = subject!
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/other/usb/path',
        massStorageDeviceFiles: ['/some/third/file', '/some/fourth/file'],
      })
      .thenReturn(fakeUsbProviders.second)
    when(fakeUsbProviders.first.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.second.scanUpdate)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '0.1.2',
        files: { system: '/some/other/file', releaseNotes: null },
        releaseNotes: 'some other fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.first.getUpdateDetails)
      .calledWith()
      .thenReturn({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.second.getUpdateDetails)
      .calledWith()
      .thenReturn({
        version: '0.1.2',
        files: { system: '/some/other/filefile', releaseNotes: null },
        releaseNotes: 'some other fake notes',
        downloadProgress: 100,
      })
    return thisSubject
      .handleAction({
        type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
        payload: {
          rootPath: '/some/usb/path',
          filePaths: ['/some/file', '/some/other/file'],
        },
        meta: { shell: true },
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
        vi.mocked(dispatch).mockReset()
        return thisSubject.handleAction({
          type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED',
          payload: {
            rootPath: '/some/other/usb/path',
            filePaths: ['/some/third/file', '/some/fourth/file'],
          },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(getUsbProvider).toHaveBeenCalledWith({
          currentVersion: CURRENT_SYSTEM_VERSION,
          massStorageDeviceRoot: '/some/usb/path',
          massStorageDeviceFiles: ['/some/file', '/some/other/file'],
        })
        expect(dispatch).toHaveBeenNthCalledWith(1, {
          type: 'robotUpdate:UPDATE_INFO',
          payload: {
            releaseNotes: 'some fake notes',
            version: '1.2.3',
            force: true,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenNthCalledWith(2, {
          type: 'robotUpdate:UPDATE_VERSION',
          payload: {
            version: '1.2.3',
            force: true,
            target: 'flex',
          },
        })
      })
      .then(() => {
        vi.mocked(dispatch).mockReset()
        return thisSubject.handleAction({
          type: 'robotUpdate:READ_SYSTEM_FILE',
          payload: { target: 'flex' },
          meta: { shell: true },
        })
      })
      .then(() => {
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:FILE_INFO',
          payload: {
            systemFile: '/some/file',
            version: '1.2.3',
            isManualFile: false,
          },
        })
      })
  })
})
