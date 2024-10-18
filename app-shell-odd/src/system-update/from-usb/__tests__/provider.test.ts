import { it, describe, vi, afterEach, expect } from 'vitest'
import { when } from 'vitest-when'
import { getProvider } from '../provider'
import { getLatestMassStorageUpdateFile as _getLatestMassStorageUpdateFile } from '../scan-device'

vi.mock('../scan-device')
vi.mock('../../../log')

const getLatestMassStorageUpdateFile = vi.mocked(
  _getLatestMassStorageUpdateFile
)

describe('system-update/from-usb/provider', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('signals available updates when given available updates', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/valid-release.zip'])
      .thenResolve({ path: '/storage/valid-release.zip', version: '1.2.3' })
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/valid-release.zip'],
    })
    const expectedUpdate = {
      version: '1.2.3',
      files: {
        system: '/storage/valid-release.zip',
        releaseNotes: expect.any(String),
      },
      releaseNotes: expect.any(String),
      downloadProgress: 100,
    }
    return expect(provider.refreshUpdateCache(progress))
      .resolves.toEqual(expectedUpdate)
      .then(() => {
        expect(progress).toHaveBeenLastCalledWith(expectedUpdate)
      })
  })
  it('signals no available update when given no available updates', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/blahblah'])
      .thenResolve(null)
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/blahblah'],
    })
    const expectedUpdate = {
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    }
    return expect(provider.refreshUpdateCache(progress))
      .resolves.toEqual(expectedUpdate)
      .then(() => {
        expect(progress).toHaveBeenLastCalledWith(expectedUpdate)
      })
  })
  it('signals no available update when the scan throws', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/blahblah'])
      .thenReject(new Error('oh no'))
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/blahblah'],
    })
    const expectedUpdate = {
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    }
    return expect(provider.refreshUpdateCache(progress))
      .resolves.toEqual(expectedUpdate)
      .then(() => {
        expect(progress).toHaveBeenLastCalledWith(expectedUpdate)
      })
  })
  it('signals no available update when the highest version update is the same version as current', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/valid-release.zip'])
      .thenResolve({ path: '/storage/valid-release.zip', version: '1.0.0' })
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/valid-release.zip'],
    })
    const expectedUpdate = {
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    }
    return expect(provider.refreshUpdateCache(progress))
      .resolves.toEqual(expectedUpdate)
      .then(() => {
        expect(progress).toHaveBeenLastCalledWith(expectedUpdate)
      })
  })
  it('throws when torn down before scanning', () => {
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/',
      massStorageDeviceFiles: [],
    })
    const progress = vi.fn()
    return provider
      .teardown()
      .then(() =>
        expect(provider.refreshUpdateCache(progress)).rejects.toThrow()
      )
      .then(() =>
        expect(progress).toHaveBeenLastCalledWith({
          version: null,
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
      )
  })
  it('throws when torn down right after scanning', () => {
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/',
      massStorageDeviceFiles: [],
    })
    const progress = vi.fn()
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/valid-release.zip'])
      .thenDo(() =>
        provider.teardown().then(() => ({
          path: '/storage/valid-release.zip',
          version: '1.0.0',
        }))
      )
    return provider
      .teardown()
      .then(() =>
        expect(provider.refreshUpdateCache(progress)).rejects.toThrow()
      )
      .then(() =>
        expect(progress).toHaveBeenLastCalledWith({
          version: null,
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
      )
  })
  it('will not run two checks at once', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/valid-release.zip'])
      .thenResolve({ path: '/storage/valid-release.zip', version: '1.0.0' })
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/valid-release.zip'],
    })
    const expectedUpdate = {
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    }
    const first = provider.refreshUpdateCache(progress)
    const second = provider.refreshUpdateCache(progress)
    return Promise.all([
      expect(first).resolves.toEqual(expectedUpdate),
      expect(second).rejects.toThrow(),
    ]).then(() => expect(getLatestMassStorageUpdateFile).toHaveBeenCalledOnce())
  })
  it('will run a second check after the first ends', () => {
    when(getLatestMassStorageUpdateFile)
      .calledWith(['/storage/valid-release.zip'])
      .thenResolve({ path: '/storage/valid-release.zip', version: '1.0.0' })
    const progress = vi.fn()
    const provider = getProvider({
      currentVersion: '1.0.0',
      massStorageDeviceRoot: '/storage',
      massStorageDeviceFiles: ['/storage/valid-release.zip'],
    })
    const expectedUpdate = {
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    }
    return expect(provider.refreshUpdateCache(progress))
      .resolves.toEqual(expectedUpdate)
      .then(() =>
        expect(provider.refreshUpdateCache(progress)).resolves.toEqual(
          expectedUpdate
        )
      )
  })
})
