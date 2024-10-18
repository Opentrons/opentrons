import { vi, describe, it, expect, afterEach } from 'vitest'
import { when } from 'vitest-when'

import { LocalAbortError } from '../../../http'
import { getProvider } from '../provider'
import { getOrDownloadManifest as _getOrDownloadManifest } from '../release-manifest'
import { cleanUpAndGetOrDownloadReleaseFiles as _cleanUpAndGetOrDownloadReleaseFiles } from '../release-files'

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
const cleanUpAndGetOrDownloadReleaseFiles = vi.mocked(
  _cleanUpAndGetOrDownloadReleaseFiles
)

describe('provider.refreshUpdateCache happy paths', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('says there is no update if the latest version is the current version', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
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
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.refreshUpdateCache(progressCallback))
      .resolves.toEqual({
        version: null,
        files: null,
        releaseNotes: null,
        downloadProgress: 0,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: null,
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(provider.getUpdateDetails()).toEqual({
          version: null,
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(cleanUpAndGetOrDownloadReleaseFiles).not.toHaveBeenCalled()
      })
  })
  it('says there is an update if a cached update is needed', () => {
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
        production: {
          '1.2.3': releaseUrls,
        },
      })

    when(cleanUpAndGetOrDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
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
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.refreshUpdateCache(progressCallback))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'oh look some release notes cool',
        downloadProgress: 100,
      })
      .then(() =>
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'oh look some release notes cool',
          downloadProgress: 100,
        })
      )
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
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
          '1.2.3': releaseUrls,
        },
      })

    when(cleanUpAndGetOrDownloadReleaseFiles)
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

    const progressCallback = vi.fn()
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    expect(provider.getUpdateDetails()).toEqual({
      version: null,
      files: null,
      releaseNotes: null,
      downloadProgress: 0,
    })
    return expect(provider.refreshUpdateCache(progressCallback))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'oh look some release notes sweet',
        downloadProgress: 100,
      })
      .then(() => {
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: null,
          releaseNotes: null,
          downloadProgress: 50,
        })
        expect(progressCallback).toHaveBeenCalledWith({
          version: '1.2.3',
          files: null,
          releaseNotes: null,
          downloadProgress: 100,
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

describe('provider.refreshUpdateCache locking', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('will not start a refresh when locked', () => {
    const provider = getProvider({
      manifestUrl: 'http://opentrons.com/releases.json',
      channel: 'release',
      updateCacheDirectory: '/some/random/directory',
      currentVersion: '1.0.0',
    })
    provider.lockUpdateCache()
    return expect(provider.refreshUpdateCache(vi.fn())).rejects.toThrow()
  })
  it('will start a refresh when locked then unlocked', () => {
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
        production: {
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
    return expect(provider.refreshUpdateCache(vi.fn())).resolves.toEqual({
      version: null,
      files: null,
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
        production: {
          '1.2.3': releaseUrls,
        },
      })
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = { ...releaseFiles, releaseNotesContent: 'oh hello' }
    when(cleanUpAndGetOrDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
      .thenResolve(releaseData)

    return expect(provider.refreshUpdateCache(vi.fn()))
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
        return expect(provider.refreshUpdateCache(progress))
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
  it('will abort when locked between manifest and download phases and return the previous update', () => {
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
        production: {
          '1.2.3': releaseUrls,
        },
      })
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = { ...releaseFiles, releaseNotesContent: 'hi' }
    when(cleanUpAndGetOrDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
      .thenResolve(releaseData)

    return expect(provider.refreshUpdateCache(vi.fn()))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'hi',
        downloadProgress: 100,
      })
      .then(() => {
        when(getOrDownloadManifest)
          .calledWith(
            expect.any(String),
            expect.any(String),
            expect.any(AbortController)
          )
          .thenDo(
            () =>
              new Promise(resolve => {
                provider.lockUpdateCache()
                resolve({ production: { '1.2.3': releaseUrls } })
              })
          )
        const progress = vi.fn()
        return expect(provider.refreshUpdateCache(progress))
          .rejects.toThrow()
          .then(() =>
            expect(progress).toHaveBeenCalledWith({
              version: '1.2.3',
              files: releaseFiles,
              releaseNotes: 'hi',
              downloadProgress: 100,
            })
          )
      })
      .then(() =>
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'hi',
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
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
          '1.2.3': releaseUrls,
        },
      })
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = {
      ...releaseFiles,
      releaseNotesContent: 'content',
    }
    when(cleanUpAndGetOrDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
      .thenResolve(releaseData)

    return expect(provider.refreshUpdateCache(vi.fn()))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'content',
        downloadProgress: 100,
      })
      .then(() => {
        when(getOrDownloadManifest)
          .calledWith(
            'http://opentrons.com/releases.json',
            '/some/random/directory',
            expect.any(AbortController)
          )
          .thenResolve({
            production: {
              '1.2.3': releaseUrls,
            },
          })
        when(cleanUpAndGetOrDownloadReleaseFiles)
          .calledWith(
            expect.any(Object),
            expect.any(String),
            expect.any(String),
            expect.any(Function),
            expect.any(AbortController)
          )
          .thenDo(
            (
              _releaseUrls,
              _cacheDirectory,
              _version,
              _progress,
              abortController
            ) =>
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
        return expect(provider.refreshUpdateCache(progress))
          .rejects.toThrow()
          .then(() =>
            expect(progress).toHaveBeenCalledWith({
              version: '1.2.3',
              files: releaseFiles,
              releaseNotes: 'content',
              downloadProgress: 100,
            })
          )
      })
      .then(() => {
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'content',
          downloadProgress: 100,
        })
      })
  })
  it('will abort when locked in the last-chance phase and return the previous update', () => {
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
        production: {
          '1.2.3': releaseUrls,
        },
      })
    const releaseFiles = {
      system: '/some/random/directory/cached-release-1.2.3/ot3-system.zip',
      releaseNotes:
        '/some/random/directory/cached-release-1.2.3/releaseNotes.md',
    }
    const releaseData = {
      ...releaseFiles,
      releaseNotesContent: 'there is some',
    }
    when(cleanUpAndGetOrDownloadReleaseFiles)
      .calledWith(
        releaseUrls,
        '/some/random/directory/versions',
        '1.2.3',
        expect.any(Function),
        expect.any(Object)
      )
      .thenResolve(releaseData)

    return expect(provider.refreshUpdateCache(vi.fn()))
      .resolves.toEqual({
        version: '1.2.3',
        files: releaseFiles,
        releaseNotes: 'there is some',
        downloadProgress: 100,
      })
      .then(() => {
        when(getOrDownloadManifest)
          .calledWith(
            'http://opentrons.com/releases.json',
            '/some/random/directory',
            expect.any(AbortController)
          )
          .thenResolve({
            production: {
              '1.2.3': releaseUrls,
            },
          })
        when(cleanUpAndGetOrDownloadReleaseFiles)
          .calledWith(
            expect.any(Object),
            expect.any(String),
            expect.any(String),
            expect.any(Function),
            expect.any(AbortController)
          )
          .thenDo(
            (
              _releaseUrls,
              _cacheDirectory,
              _version,
              _progress,
              _abortController
            ) =>
              new Promise(resolve => {
                provider.lockUpdateCache()
                resolve(releaseData)
              })
          )
        const progress = vi.fn()
        return expect(provider.refreshUpdateCache(progress))
          .rejects.toThrow()
          .then(() =>
            expect(progress).toHaveBeenCalledWith({
              version: '1.2.3',
              files: releaseFiles,
              releaseNotes: 'there is some',
              downloadProgress: 100,
            })
          )
      })
      .then(() =>
        expect(provider.getUpdateDetails()).toEqual({
          version: '1.2.3',
          files: releaseFiles,
          releaseNotes: 'there is some',
          downloadProgress: 100,
        })
      )
  })
  it('will not run two checks at once', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
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
    const first = provider.refreshUpdateCache(progressCallback)
    const second = provider.refreshUpdateCache(progressCallback)
    return Promise.all([
      expect(first).resolves.toEqual({
        version: null,
        files: null,
        releaseNotes: null,
        downloadProgress: 0,
      }),
      expect(second).rejects.toThrow(),
    ]).then(() => expect(getOrDownloadManifest).toHaveBeenCalledOnce())
  })
  it('will run a second check after the first completes', () => {
    when(getOrDownloadManifest)
      .calledWith(
        'http://opentrons.com/releases.json',
        '/some/random/directory',
        expect.any(AbortController)
      )
      .thenResolve({
        production: {
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
    return expect(provider.refreshUpdateCache(progressCallback))
      .resolves.toEqual({
        version: null,
        files: null,
        releaseNotes: null,
        downloadProgress: 0,
      })
      .then(() =>
        expect(provider.refreshUpdateCache(progressCallback)).resolves.toEqual({
          version: null,
          files: null,
          releaseNotes: null,
          downloadProgress: 0,
        })
      )
  })
})
