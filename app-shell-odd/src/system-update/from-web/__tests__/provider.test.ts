import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { LocalAbortError } from '../../../http'
import { getProvider } from '../provider'
import {
  cleanUpAndDownloadReleaseFiles as _cleanUpAndDownloadReleaseFiles,
  downloadReleaseNotes as _downloadReleaseNotes,
  ensureCleanReleaseCacheForVersion as _ensureCleanReleaseCacheForVersion,
  getReleaseFilesIfExist as _getReleaseFilesIfExist,
  removeTemporaryDownloads as _removeTemporaryDownloads,
} from '../release-files'
import { getOrDownloadManifest as _getOrDownloadManifest } from '../release-manifest'

import type { ReleaseManifest } from '../../types'

vi.mock('../../../log')
vi.mock('../release-manifest', async importOriginal => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const original = await importOriginal<typeof import('../release-manifest')>()
  return {
    ...original,
    getOrDownloadManifest: vi.fn(),
  }
})
vi.mock('../release-files')

const getOrDownloadManifest = vi.mocked(_getOrDownloadManifest)
const cleanUpAndDownloadReleaseFiles = vi.mocked(
  _cleanUpAndDownloadReleaseFiles
)
const downloadReleaseNotes = vi.mocked(_downloadReleaseNotes)
const removeTemporaryDownloads = vi.mocked(_removeTemporaryDownloads)
const getReleaseFilesIfExist = vi.mocked(_getReleaseFilesIfExist)
const ensureCleanReleaseCacheForVersion = vi.mocked(
  _ensureCleanReleaseCacheForVersion
)

describe('provider.cleanup', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('calls removeTemporaryDownloads on cleanup', async () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    await provider.cleanup()
    expect(removeTemporaryDownloads).toHaveBeenCalledExactlyOnceWith(
      '/some/random/directory/versions'
    )
  })
})

describe('provider.scanUpdate happy paths', () => {
  afterEach(() => {
    expect(cleanUpAndDownloadReleaseFiles).not.toHaveBeenCalled()
    vi.resetAllMocks()
  })
  it('says there is no update if the latest update is in the old production key', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
          '2.0.0': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      } as object as ReleaseManifest)
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: null,
        files: { system: null, releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 0,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(downloadReleaseNotes).not.toHaveBeenCalled()
        expect(ensureCleanReleaseCacheForVersion).not.toHaveBeenCalled()
      })
  })
  it('says there is no update if the latest version is the current version', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: null,
        files: { system: null, releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 0,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(downloadReleaseNotes).not.toHaveBeenCalled()
        expect(ensureCleanReleaseCacheForVersion).not.toHaveBeenCalled()
      })
  })
  it('says there is a downloaded update if the latest version is already downloaded', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.5': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    when(getReleaseFilesIfExist)
      .calledWith(
        {
          system: 'http://opentrons.com/system.zip',
          fullImage: 'http://opentrons.com/fullImage.zip',
          version: 'http://opentrons.com/version.json',
          releaseNotes: 'http://opentrons.com/releaseNotes.md',
        },
        '/some/random/directory/versions',
        '1.2.5'
      )
      .thenResolve({
        system: '/some/random/path.zip',
        releaseNotes: null,
        releaseNotesContent: null,
      })
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: '1.2.5',
        files: { system: '/some/random/path.zip', releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 100,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.5',
          files: { system: '/some/random/path.zip', releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 100,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.5',
          files: { system: '/some/random/path.zip', releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 100,
        })
        expect(downloadReleaseNotes).not.toHaveBeenCalled()
        expect(ensureCleanReleaseCacheForVersion).not.toHaveBeenCalled()
      })
  })
  it('says there is an update if an update is needed', () => {
    const releaseUrls = {
      system: 'http://opentrons.com/system.zip',
      fullImage: 'http://opentrons.com/fullImage.zip',
      version: 'http://opentrons.com/version.json',
      releaseNotes: 'http://opentrons.com/releaseNotes.md',
    }
    when(ensureCleanReleaseCacheForVersion)
      .calledWith('/some/random/directory/versions', '1.2.3')
      .thenResolve('/some/random/directory/versions/1.2.3')
    when(downloadReleaseNotes)
      .calledWith(
        'http://opentrons.com/releaseNotes.md',
        '/some/random/directory/versions/1.2.3',
        expect.any(AbortController)
      )
      .thenResolve({
        releaseNotes: '/some/random/directory/versions/1.2.3/releaseNotes.md',
        releaseNotesContent: 'some release notes cool',
      })
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': releaseUrls,
        },
      })

    when(getReleaseFilesIfExist)
      .calledWith(releaseUrls, '/some/random/directory/versions', '1.2.3')
      .thenResolve(null)

    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: '1.2.3',
        files: {
          system: null,
          releaseNotes: '/some/random/directory/versions/1.2.3/releaseNotes.md',
        },
        releaseNotes: 'some release notes cool',
        downloadProgress: 0,
      })
      .then(() =>
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: {
            system: null,
            releaseNotes:
              '/some/random/directory/versions/1.2.3/releaseNotes.md',
          },
          releaseNotes: 'some release notes cool',
          downloadProgress: 0,
        })
      )
  })
})

describe('provider.downloadUpdate happy paths', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('downloads nothing if there is no update', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: null,
        files: { system: null, releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 0,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        return expect(
          provider.downloadUpdate(progressCallback)
        ).resolves.toEqual({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: null,
          files: { system: null, releaseNotes: null },
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(cleanUpAndDownloadReleaseFiles).not.toHaveBeenCalled()
      })
  })
  it('downloads nothing if the update is already downloaded', () => {
    const releaseUrls = {
      system: 'http://opentrons.com/system.zip',
      fullImage: 'http://opentrons.com/fullImage.zip',
      version: 'http://opentrons.com/version.json',
      releaseNotes: 'http://opentrons.com/releaseNotes.md',
    }
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = {
      ...releaseFiles,
      releaseNotesContent: 'oh look some release notes cool',
    }
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': releaseUrls,
        },
      })

    when(getReleaseFilesIfExist)
      .calledWith(releaseUrls, '/some/random/directory/versions', '1.2.3')
      .thenResolve(releaseData)

    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'oh look some release notes cool',
        downloadProgress: 100,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh look some release notes cool',
          downloadProgress: 100,
        })
        return expect(
          provider.downloadUpdate(progressCallback)
        ).resolves.toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh look some release notes cool',
          downloadProgress: 100,
        })
      })
  })
  it('says there is an update and forwards progress if an update download is needed', () => {
    const releaseUrls = {
      system: 'http://opentrons.com/system.zip',
      fullImage: 'http://opentrons.com/fullImage.zip',
      version: 'http://opentrons.com/version.json',
      releaseNotes: 'http://opentrons.com/releaseNotes.md',
    }
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = {
      ...releaseFiles,
      releaseNotesContent: 'oh look some release notes sweet',
    }
    when(ensureCleanReleaseCacheForVersion)
      .calledWith('/some/random/directory/versions', '1.2.3')
      .thenResolve('/some/random/directory/versions/1.2.3')
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': releaseUrls,
        },
      })
    when(getReleaseFilesIfExist)
      .calledWith(releaseUrls, '/some/random/directory/versions', '1.2.3')
      .thenResolve(null)

    when(cleanUpAndDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
      .thenDo(
        (
          _releaseUrls,
          _cacheDir,
          _version,
          progressCallback,
          _abortController
        ) =>
          new Promise<void>(resolve => {
            progressCallback({ size: 100, downloaded: 0 })
            resolve()
          })
            .then(
              () =>
                new Promise<void>(resolve => {
                  progressCallback({ size: 100, downloaded: 50 })
                  resolve()
                })
            )
            .then(
              () =>
                new Promise(resolve => {
                  progressCallback({ size: 100, downloaded: 100 })
                  resolve(releaseData)
                })
            )
      )
    when(downloadReleaseNotes)
      .calledWith(
        'http://opentrons.com/releaseNotes.md',
        '/some/random/directory/versions/1.2.3',
        expect.any(AbortController)
      )
      .thenResolve({
        releaseNotes: releaseData.releaseNotes,
        releaseNotesContent: releaseData.releaseNotesContent,
      })

    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: {
        system: null,
        releaseNotes: null,
      },
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.scanUpdate(progressCallback))
      .resolves.toEqual({
        version: '1.2.3',
        files: {
          system: null,
          releaseNotes: releaseData.releaseNotes,
        },
        releaseNotes: releaseData.releaseNotesContent,
        downloadProgress: 0,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: {
            system: null,
            releaseNotes: releaseData.releaseNotes,
          },
          releaseNotes: releaseData.releaseNotesContent,
          downloadProgress: 0,
        })
        return expect(
          provider.downloadUpdate(progressCallback)
        ).resolves.toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: releaseData.releaseNotesContent,
          downloadProgress: 100,
        })
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: { system: null, releaseNotes: releaseData.releaseNotes },
          releaseNotes: releaseData.releaseNotesContent,
          downloadProgress: 0,
        })
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: { system: null, releaseNotes: releaseData.releaseNotes },
          releaseNotes: releaseData.releaseNotesContent,
          downloadProgress: 50,
        })
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh look some release notes sweet',
          downloadProgress: 100,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh look some release notes sweet',
          downloadProgress: 100,
        })
      })
  })
})

describe('provider locking', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('will not start a scan when locked', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    provider.lockUpdateCache()
    return expect(provider.scanUpdate(vi.fn())).rejects.toThrow()
  })
  it('will not start a download when locked', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    provider.lockUpdateCache()
    return expect(provider.downloadUpdate(vi.fn())).rejects.toThrow()
  })
  it('will start a scan when locked then unlocked', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    provider.lockUpdateCache()
    provider.unlockUpdateCache()
    return expect(provider.scanUpdate(vi.fn())).resolves.toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
  })
  it('will start a download when locked then unlocked', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    provider.lockUpdateCache()
    provider.unlockUpdateCache()
    return expect(provider.downloadUpdate(vi.fn())).resolves.toEqual({
      version: null,
      files: { system: null, releaseNotes: null },
      releaseNotes: null,
      downloadProgress: 0,
    })
  })
  it('will abort when locked in the manifest phase and return the previous update', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    const releaseUrls = {
      system: 'http://opentrons.com/system.zip',
      fullImage: 'http://opentrons.com/fullImage.zip',
      version: 'http://opentrons.com/version.json',
      releaseNotes: 'http://opentrons.com/releaseNotes.md',
    }
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': releaseUrls,
        },
      })
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = { ...releaseFiles, releaseNotesContent: 'oh hello' }
    when(getReleaseFilesIfExist)
      .calledWith(releaseUrls, '/some/random/directory/versions', '1.2.3')
      .thenResolve(releaseData)

    return expect(provider.scanUpdate(vi.fn()))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'oh hello',
        downloadProgress: 100,
      })
      .then(() => {
        when(getOrDownloadManifest)
          .calledWith(
            'http://opentrons.com/releases.json',
            '/some/random/directory',
            expect.any(AbortController)
          )
          .thenDo(
            (_manifestUrl, _cacheDirectory, abortController) =>
              new Promise((resolve, reject) => {
                abortController.signal.addEventListener(
                  'abort',
                  () => {
                    reject(new LocalAbortError(abortController.signal.reason))
                  },
                  { once: true }
                )
                provider.lockUpdateCache()
              })
          )
        const progress = vi.fn()
        return expect(provider.scanUpdate(progress))
          .rejects.toThrow()
          .then(() =>
            expect(progress).toHaveBeenCalledWith({
              version: '1.2.3',
              files: releaseFiles,
              releaseNotes: 'oh hello',
              downloadProgress: 100,
            })
          )
      })
      .then(() =>
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh hello',
          downloadProgress: 100,
        })
      )
  })

  it('will abort when locked in the file download phase and return the previous update', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    const releaseUrls = {
      system: 'http://opentrons.com/system.zip',
      fullImage: 'http://opentrons.com/fullImage.zip',
      version: 'http://opentrons.com/version.json',
      releaseNotes: 'http://opentrons.com/releaseNotes.md',
    }
    when(ensureCleanReleaseCacheForVersion)
      .calledWith('/some/random/directory/versions', '1.2.3')
      .thenResolve('/some/random/directory/versions/1.2.3')

    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': releaseUrls,
        },
      })
    when(getReleaseFilesIfExist)
      .calledWith(releaseUrls, '/some/random/directory/versions', '1.2.3')
      .thenResolve(null)
    when(cleanUpAndDownloadReleaseFiles)
      .calledWith(
        expect.any(Object),
        expect.any(String),
        expect.any(String),
        expect.any(Function),
        expect.any(AbortController)
      )
      .thenDo(
        (_releaseUrls, _cacheDirectory, _version, _progress, abortController) =>
          new Promise((resolve, reject) => {
            abortController.signal.addEventListener(
              'abort',
              () => {
                reject(new LocalAbortError(abortController.signal.reason))
              },
              { once: true }
            )
            provider.lockUpdateCache()
          })
      )
    when(downloadReleaseNotes)
      .calledWith(
        'http://opentrons.com/releaseNotes.md',
        '/some/random/directory/versions/1.2.3',
        expect.any(AbortController)
      )
      .thenResolve({
        releaseNotes: '/some/random/directory/versions/1.2.3/releaseNotes.md',
        releaseNotesContent: 'some release notes cool',
      })

    return expect(provider.scanUpdate(vi.fn()))
      .resolves.toEqual({
        version: '1.2.3',
        files: {
          system: null,
          releaseNotes: '/some/random/directory/versions/1.2.3/releaseNotes.md',
        },
        releaseNotes: 'some release notes cool',
        downloadProgress: 0,
      })
      .then(() => {
        const progress = vi.fn()
        return expect(provider.downloadUpdate(progress))
          .rejects.toThrow()
          .then(() =>
            expect(progress).toHaveBeenCalledWith({
              version: '1.2.3',
              files: {
                system: null,
                releaseNotes:
                  '/some/random/directory/versions/1.2.3/releaseNotes.md',
              },
              releaseNotes: 'some release notes cool',
              downloadProgress: 0,
            })
          )
      })
      .then(() => {
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: {
            system: null,
            releaseNotes:
              '/some/random/directory/versions/1.2.3/releaseNotes.md',
          },
          releaseNotes: 'some release notes cool',
          downloadProgress: 0,
        })
      })
  })
  it('will not run two scans at once', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    const first = provider.scanUpdate(progressCallback)
    const second = provider.scanUpdate(progressCallback)
    return Promise.all([
      expect(first).resolves.toEqual({
        version: null,
        files: { system: null, releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 0,
      }),
      expect(second).rejects.toThrow(),
    ]).then(() => expect(getOrDownloadManifest).toHaveBeenCalledOnce())
  })
  it('will not run a scan and download at once', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        productionV2: {
          '1.2.3': {
            system: 'http://opentrons.com/system.zip',
            fullImage: 'http://opentrons.com/fullImage.zip',
            version: 'http://opentrons.com/version.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
        },
      })
    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.2.3',
    })
    const first = provider.scanUpdate(progressCallback)
    const second = provider.downloadUpdate(progressCallback)
    return Promise.all([
      expect(first).resolves.toEqual({
        version: null,
        files: { system: null, releaseNotes: null },
        releaseNotes: null,
        downloadProgress: 0,
      }),
      expect(second).rejects.toThrow(),
    ]).then(() => expect(getOrDownloadManifest).toHaveBeenCalledOnce())
  })
})
