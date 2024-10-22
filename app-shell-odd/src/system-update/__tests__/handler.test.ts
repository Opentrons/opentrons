// app-shell self-update tests
import { when } from 'vitest-when'
import { rm } from 'fs-extra'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import tempy from 'tempy'

import * as Cfg from '../../config'
import { CONFIG_INITIALIZED, VALUE_UPDATED } from '../../constants'
import {
  manageDriver,
  createUpdateDriver,
  CURRENT_SYSTEM_VERSION,
} from '../handler'
import { FLEX_MANIFEST_URL } from '../constants'
import { getSystemUpdateDir as _getSystemUpdateDir } from '../directories'
import { getProvider as _getWebProvider } from '../from-web'
import { getProvider as _getUsbProvider } from '../from-usb'

import type { UpdateProvider } from '../types'
import type { UpdateDriver } from '../handler'
import type { WebUpdateSource } from '../from-web'
import type { USBUpdateSource } from '../from-usb'
import type { Dispatch } from '../../types'

import type {
  ConfigInitializedAction,
  ConfigValueUpdatedAction,
} from '@opentrons/app/src/redux/config'

vi.unmock('electron-updater') // ?
vi.mock('electron-updater')
vi.mock('../../log')
vi.mock('../../config')
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
      .thenReturn(({ channel: 'alpha' } as any) as Cfg.Config['update'])
    const driver = manageDriver(dispatch)
    expect(driver.getUpdateDriver()).toBeNull()
    expect(getConfig).not.toHaveBeenCalled()
    return driver
      .handleAction({
        type: CONFIG_INITIALIZED,
      } as ConfigInitializedAction)
      .then(() => {
        expect(driver.getUpdateDriver()).not.toBeNull()
        expect(getConfig).toHaveBeenCalledOnce()
        expect(getWebProvider).toHaveBeenCalledWith({
          manifestUrl: FLEX_MANIFEST_URL,
          channel: 'alpha',
          updateCacheDirectory: testDir,
          currentVersion: CURRENT_SYSTEM_VERSION,
        })
      })
  })

  it('reloads the web driver when appropriate', () => {
    when(getConfig)
      .calledWith('update')
      .thenReturn(({ channel: 'alpha' } as any) as Cfg.Config['update'])
    const fakeProvider = {
      teardown: vi.fn(),
      refreshUpdateCache: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: vi.fn(),
      source: () => (({ channel: 'alpha' } as any) as WebUpdateSource),
    }
    const fakeProvider2 = {
      ...fakeProvider,
      source: () => (({ channel: 'beta' } as any) as WebUpdateSource),
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
          .thenReturn(({
            channel: 'beta',
          } as any) as Cfg.Config['update'])
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
    refreshUpdateCache: vi.fn(),
    getUpdateDetails: vi.fn(),
    lockUpdateCache: vi.fn(),
    unlockUpdateCache: vi.fn(),
    name: vi.fn(),
    source: () => (({ channel: 'alpha' } as any) as WebUpdateSource),
  }
  const fakeUsbProviders: Record<string, UpdateProvider<USBUpdateSource>> = {
    first: {
      teardown: vi.fn(),
      refreshUpdateCache: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/usb/path',
      source: () =>
        (({
          massStorageRootPath: '/some/usb/path',
        } as any) as USBUpdateSource),
    },
  }

  beforeEach(() => {
    const thisTd = tempy.directory()
    testDir = thisTd
    dispatch = vi.fn()
    when(getSystemUpdateDir).calledWith().thenReturn(thisTd)
    when(getConfig)
      .calledWith('update')
      .thenReturn(({ channel: 'alpha' } as any) as Cfg.Config['update'])
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
      refreshUpdateCache: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/usb/path',
      source: () =>
        (({
          massStorageRootPath: '/some/usb/path',
        } as any) as USBUpdateSource),
    }
    fakeUsbProviders.second = {
      teardown: vi.fn(),
      refreshUpdateCache: vi.fn(),
      getUpdateDetails: vi.fn(),
      lockUpdateCache: vi.fn(),
      unlockUpdateCache: vi.fn(),
      name: () => '/some/other/usb/path',
      source: () =>
        (({
          massStorageRootPath: '/some/other/usb/path',
        } as any) as USBUpdateSource),
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

  it('checks updates when told to check updates', () => {
    const thisSubject = subject as UpdateDriver
    when(fakeProvider.refreshUpdateCache)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: null,
              files: null,
              downloadProgress: 0,
              releaseNotes: null,
            })
            resolve({
              version: null,
              files: null,
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
            version: null,
            releaseNotes: null,
            force: false,
            target: 'flex',
          },
        })
        expect(dispatch).toHaveBeenCalledWith({
          type: 'robotUpdate:UPDATE_VERSION',
          payload: { version: null, force: false, target: 'flex' },
        })
      })
  })
  it('forwards in-progress downloads when no USB updates are present', () => {
    const thisSubject = subject as UpdateDriver
    when(fakeProvider.refreshUpdateCache)
      .calledWith(expect.any(Function))
      .thenDo(
        progress =>
          new Promise(resolve => {
            progress({
              version: null,
              files: null,
              downloadProgress: 0,
              releaseNotes: null,
            })
            progress({
              version: '1.2.3',
              files: null,
              downloadProgress: 0,
              releaseNotes: null,
            })
            progress({
              version: '1.2.3',
              files: null,
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
      .handleAction({ type: 'shell:CHECK_UPDATE', meta: { shell: true } })
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
    const thisSubject = subject as UpdateDriver
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.refreshUpdateCache)
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
    const thisSubject = subject as UpdateDriver
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.refreshUpdateCache)
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
    const thisSubject = subject as UpdateDriver
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.refreshUpdateCache)
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
    const thisSubject = subject as UpdateDriver
    when(getUsbProvider)
      .calledWith({
        currentVersion: CURRENT_SYSTEM_VERSION,
        massStorageDeviceRoot: '/some/usb/path',
        massStorageDeviceFiles: ['/some/file', '/some/other/file'],
      })
      .thenReturn(fakeUsbProviders.first)
    when(fakeUsbProviders.first.refreshUpdateCache)
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
    const thisSubject = subject as UpdateDriver
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
    when(fakeUsbProviders.first.refreshUpdateCache)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '0.1.2',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeProvider.refreshUpdateCache)
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
    const thisSubject = subject as UpdateDriver
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
    when(fakeUsbProviders.first.refreshUpdateCache)
      .calledWith(expect.any(Function))
      .thenResolve({
        version: '1.2.3',
        files: { system: '/some/file', releaseNotes: null },
        releaseNotes: 'some fake notes',
        downloadProgress: 100,
      })
    when(fakeUsbProviders.second.refreshUpdateCache)
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
