// TODO(mc, 2020-06-11): test all release-files functions
import { promises as fs } from 'fs'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { fetchToFile as httpFetchToFile } from '../../../http'
import { directoryWithCleanup } from '../../utils'
import {
  downloadReleaseFiles,
  ensureCleanReleaseCacheForVersion,
  getReleaseFiles,
  removeTemporaryDownloads,
} from '../release-files'

import type { ReleaseSetUrls } from '../../types'

vi.mock('../../../http')
vi.mock('../../../log')

const fetchToFile = vi.mocked(httpFetchToFile)

describe('ensureCleanReleaseCacheForVersion', () => {
  it('should create the appropriate directory tree if it does not exist', () =>
    directoryWithCleanup(directory =>
      ensureCleanReleaseCacheForVersion(
        path.join(directory, 'somerandomdirectory', 'someotherrandomdirectory'),
        '1.2.3'
      )
        .then(cacheDirectory => {
          expect(cacheDirectory).toEqual(
            path.join(
              directory,
              'somerandomdirectory',
              'someotherrandomdirectory',
              'cached-release-1.2.3'
            )
          )
          return fs.stat(cacheDirectory)
        })
        .then(stats => expect(stats.isDirectory()).toBeTruthy())
    ))
  it('should create the appropriate directory if the base directory entry is occupied by a file', () =>
    directoryWithCleanup(directory =>
      fs
        .writeFile(
          path.join(directory, 'somerandomdirectory'),
          'somerandomdata'
        )
        .then(() =>
          ensureCleanReleaseCacheForVersion(
            path.join(directory, 'somerandomdirectory'),
            '1.2.3'
          )
        )
        .then(cacheDirectory => {
          expect(cacheDirectory).toEqual(
            path.join(directory, 'somerandomdirectory', 'cached-release-1.2.3')
          )
          return fs.stat(cacheDirectory)
        })
        .then(stats => expect(stats.isDirectory()).toBeTruthy())
    ))
  it('should create the appropriate directory if the version directory entry is occupied by a file', () =>
    directoryWithCleanup(directory =>
      fs
        .mkdir(path.join(directory, 'somerandomdirectory'))
        .then(() =>
          fs.writeFile(
            path.join(directory, 'somerandomdirectory', 'cached-release-1.2.3'),
            'somerandomdata'
          )
        )
        .then(() =>
          ensureCleanReleaseCacheForVersion(
            path.join(directory, 'somerandomdirectory'),
            '1.2.3'
          )
        )
        .then(baseDirectory => {
          expect(baseDirectory).toEqual(
            path.join(directory, 'somerandomdirectory', 'cached-release-1.2.3')
          )
          return fs.stat(baseDirectory)
        })
        .then(stats => expect(stats.isDirectory()).toBeTruthy())
    ))
  it('should remove caches for other versions from the cache directory', () =>
    directoryWithCleanup(directory =>
      fs
        .mkdir(path.join(directory, 'cached-release-0.1.2'))
        .then(() => fs.mkdir(path.join(directory, 'cached-release-4.5.6')))
        .then(() =>
          fs.writeFile(
            path.join(directory, 'cached-release-4.5.6', 'test.zip'),
            'asfjohasda'
          )
        )
        .then(() => ensureCleanReleaseCacheForVersion(directory, '1.2.3'))
        .then(cacheDirectory => {
          expect(cacheDirectory).toEqual(
            path.join(directory, 'cached-release-1.2.3')
          )
          return fs.readdir(directory)
        })
        .then(contents => expect(contents).toEqual(['cached-release-1.2.3']))
    ))
  it('should leave already-existing correct version cache directories untouched', () =>
    directoryWithCleanup(directory =>
      fs
        .mkdir(path.join(directory, 'cached-release-1.2.3'))
        .then(() =>
          fs.writeFile(
            path.join(directory, 'cached-release-1.2.3', 'system.zip'),
            '123123'
          )
        )
        .then(() => ensureCleanReleaseCacheForVersion(directory, '1.2.3'))
        .then(cacheDirectory => fs.readdir(cacheDirectory))
        .then(contents => {
          expect(contents).toEqual(['system.zip'])
          return fs.readFile(
            path.join(directory, 'cached-release-1.2.3', 'system.zip'),
            { encoding: 'utf-8' }
          )
        })
        .then(contents => expect(contents).toEqual('123123'))
    ))
})

describe('getReleaseFiles', () => {
  it('should fail if no release files are cached', () =>
    directoryWithCleanup(directory =>
      expect(
        getReleaseFiles(
          {
            fullImage: 'http://opentrons.com/fullImage.zip',
            system: 'http://opentrons.com/ot3-system.zip',
            version: 'http//opentrons.com/VERSION.json',
            releaseNotes: 'http://opentrons.com/releaseNotes.md',
          },
          directory
        )
      ).rejects.toThrow()
    ))
  it('should fail if system is not present but all others are', () =>
    directoryWithCleanup(directory =>
      fs
        .writeFile(path.join(directory, 'fullImage.zip'), 'aslkdjasd')
        .then(() => fs.writeFile(path.join(directory, 'VERSION.json'), 'asdas'))
        .then(() =>
          fs.writeFile(path.join(directory, 'releaseNotes.md'), 'asdalsda')
        )
        .then(() =>
          expect(
            getReleaseFiles(
              {
                fullImage: 'http://opentrons.com/fullImage.zip',
                system: 'http://opentrons.com/ot3-system.zip',
                version: 'http//opentrons.com/VERSION.json',
                releaseNotes: 'http://opentrons.com/releaseNotes.md',
              },
              directory
            )
          ).rejects.toThrow()
        )
    ))
  it('should return available files if system.zip is one of them', () =>
    directoryWithCleanup(directory =>
      fs
        .writeFile(path.join(directory, 'ot3-system.zip'), 'asdjlhasd')
        .then(() =>
          expect(
            getReleaseFiles(
              {
                fullImage: 'http://opentrons.com/fullImage.zip',
                system: 'http://opentrons.com/ot3-system.zip',
                version: 'http//opentrons.com/VERSION.json',
                releaseNotes: 'http://opentrons.com/releaseNotes.md',
              },
              directory
            )
          ).resolves.toEqual({
            system: path.join(directory, 'ot3-system.zip'),
            releaseNotes: null,
            releaseNotesContent: null,
          })
        )
    ))
  it('should find release notes if available', () =>
    directoryWithCleanup(directory =>
      fs
        .writeFile(path.join(directory, 'ot3-system.zip'), 'asdjlhasd')
        .then(() =>
          fs.writeFile(path.join(directory, 'releaseNotes.md'), 'asdasda')
        )
        .then(() =>
          expect(
            getReleaseFiles(
              {
                fullImage: 'http://opentrons.com/fullImage.zip',
                system: 'http://opentrons.com/ot3-system.zip',
                version: 'http//opentrons.com/VERSION.json',
                releaseNotes: 'http://opentrons.com/releaseNotes.md',
              },
              directory
            )
          ).resolves.toEqual({
            system: path.join(directory, 'ot3-system.zip'),
            releaseNotes: path.join(directory, 'releaseNotes.md'),
            releaseNotesContent: 'asdasda',
          })
        )
    ))
})

describe('downloadReleaseFiles', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should try and fetch both system zip and release notes', () =>
    directoryWithCleanup(directory => {
      let tempSystemPath = ''
      let tempReleaseNotesPath = ''
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/ot3-system.zip',
          expect.any(String),
          expect.any(Object)
        )
        .thenDo((_url, dest, _opts) => {
          tempSystemPath = dest
          return fs
            .writeFile(dest, 'this is the contents of the system.zip')
            .then(() => dest)
        })
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/releaseNotes.md',
          expect.any(String),
          expect.any(Object)
        )
        .thenDo((_url, dest) => {
          tempReleaseNotesPath = dest
          return fs
            .writeFile(dest, 'this is the contents of the release notes')
            .then(() => dest)
        })
      const progress = vi.fn()
      return downloadReleaseFiles(
        {
          system: 'http://opentrons.com/ot3-system.zip',
          releaseNotes: 'http://opentrons.com/releaseNotes.md',
        } as ReleaseSetUrls,
        directory,
        progress,
        new AbortController()
      ).then(files => {
        expect(files).toEqual({
          system: path.join(directory, 'ot3-system.zip'),
          releaseNotes: path.join(directory, 'releaseNotes.md'),
          releaseNotesContent: 'this is the contents of the release notes',
        })
        return Promise.all([
          fs
            .readFile(files.system, { encoding: 'utf-8' })
            .then(contents =>
              expect(contents).toEqual('this is the contents of the system.zip')
            ),
          fs
            .readFile(files.releaseNotes!, { encoding: 'utf-8' })
            .then(contents =>
              expect(contents).toEqual(
                'this is the contents of the release notes'
              )
            ),
          expect(fs.stat(tempSystemPath)).rejects.toThrow(),
          expect(fs.stat(tempReleaseNotesPath)).rejects.toThrow(),
        ])
      })
    }))
  it('should fetch only system zip if only system is available', () =>
    directoryWithCleanup(directory => {
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/ot3-system.zip',
          expect.any(String),
          expect.any(Object)
        )
        .thenDo((_url, dest, _opts) => {
          return fs
            .writeFile(dest, 'this is the contents of the system.zip')
            .then(() => dest)
        })
      const progress = vi.fn()
      return downloadReleaseFiles(
        {
          system: 'http://opentrons.com/ot3-system.zip',
        } as ReleaseSetUrls,
        directory,
        progress,
        new AbortController()
      ).then(files => {
        expect(files).toEqual({
          system: path.join(directory, 'ot3-system.zip'),
          releaseNotes: null,
          releaseNotesContent: null,
        })
        return fs
          .readFile(files.system, { encoding: 'utf-8' })
          .then(contents =>
            expect(contents).toEqual('this is the contents of the system.zip')
          )
      })
    }))
  it('should tolerate failing to fetch release notes', () =>
    directoryWithCleanup(directory => {
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/ot3-system.zip',
          expect.any(String),
          expect.any(Object)
        )
        .thenDo((_url, dest, _opts) => {
          return fs
            .writeFile(dest, 'this is the contents of the system.zip')
            .then(() => dest)
        })
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/releaseNotes.md',
          expect.any(String),
          expect.any(Object)
        )
        .thenReject(new Error('oh no!'))
      const progress = vi.fn()
      return downloadReleaseFiles(
        {
          system: 'http://opentrons.com/ot3-system.zip',
          releaseNotes: 'http://opentrons.com/releaseNotes.md',
        } as ReleaseSetUrls,
        directory,
        progress,
        new AbortController()
      ).then(files => {
        expect(files).toEqual({
          system: path.join(directory, 'ot3-system.zip'),
          releaseNotes: null,
          releaseNotesContent: null,
        })
        return fs
          .readFile(files.system, { encoding: 'utf-8' })
          .then(contents =>
            expect(contents).toEqual('this is the contents of the system.zip')
          )
      })
    }))
  it('should fail if it cannot fetch system zip', () =>
    directoryWithCleanup(directory => {
      let tempReleaseNotesPath = ''
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/ot3-system.zip',
          expect.any(String),
          expect.any(Object)
        )
        .thenReject(new Error('oh no'))
      when(fetchToFile)
        .calledWith(
          'http://opentrons.com/releaseNotes.md',
          expect.any(String),
          expect.any(Object)
        )
        .thenDo((_url, dest) => {
          tempReleaseNotesPath = dest
          return fs
            .writeFile(dest, 'this is the contents of the release notes')
            .then(() => dest)
        })
      const progress = vi.fn()
      return (
        expect(
          downloadReleaseFiles(
            {
              system: 'http://opentrons.com/ot3-system.zip',
              releaseNotes: 'http://opentrons.com/releaseNotes.md',
            } as ReleaseSetUrls,
            directory,
            progress,
            new AbortController()
          )
        )
          .rejects.toThrow()
          // the release notes are downloaded before-hand and kept
          .then(() => expect(fs.stat(tempReleaseNotesPath)).resolves)
      )
    }))
  it('should allow the http requests to be aborted', () =>
    directoryWithCleanup(directory => {
      const aborter = new AbortController()
      const progressCallback = vi.fn()
      when(fetchToFile)
        .calledWith('http://opentrons.com/ot3-system.zip', expect.any(String), {
          onProgress: progressCallback,
          signal: aborter.signal,
        })
        .thenDo(
          (_url, dest, options) =>
            new Promise((resolve, reject) => {
              if (options?.signal == null) {
                throw new Error(
                  'expected fetchToFile to receive an abort signal'
                )
              }
              const { signal } = options
              const listener = () => {
                reject(signal.reason)
              }
              signal.addEventListener('abort', listener, { once: true })
              aborter.abort('oh no!')
              return fs
                .writeFile(dest, 'this is the contents of the system.zip')
                .then(() => dest)
            })
        )
      return expect(
        downloadReleaseFiles(
          {
            system: 'http://opentrons.com/ot3-system.zip',
          } as ReleaseSetUrls,
          directory,
          progressCallback,
          aborter
        )
      ).rejects.toThrow()
    }))
})

describe('removeTemporaryDownloads', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should remove files with the .odd-download suffix', async () => {
    await directoryWithCleanup(async directory => {
      await fs.mkdir(path.join(directory, 'fake-version-1'))
      await fs.writeFile(
        path.join(directory, 'fake-version-1', 'something.zip.odd-download'),
        'hello'
      )
      await fs.writeFile(
        path.join(directory, 'fake-version-1', 'something.md.odd-download'),
        'goodbye'
      )
      await fs.mkdir(path.join(directory, 'fake-version-2'))
      await fs.writeFile(
        path.join(directory, 'fake-version-2', 'fakedl.zip.odd-download'),
        'woohoo'
      )
      await removeTemporaryDownloads(directory)
      const fv1dir = await fs.readdir(path.join(directory, 'fake-version-1'))
      expect(fv1dir).toEqual([])
      const fv2dir = await fs.readdir(path.join(directory, 'fake-version-2'))
      expect(fv2dir).toEqual([])
    })
  })
  it('should not remove files without the .odd-download suffix', async () => {
    await directoryWithCleanup(async directory => {
      await fs.mkdir(path.join(directory, 'fake-version-1'))
      await fs.writeFile(
        path.join(directory, 'fake-version-1', 'something.zip'),
        'hello'
      )
      await fs.writeFile(
        path.join(directory, 'fake-version-1', 'something.md'),
        'goodbye'
      )
      await fs.mkdir(path.join(directory, 'fake-version-2'))
      await fs.writeFile(
        path.join(directory, 'fake-version-2', 'fakedl.zip'),
        'woohoo'
      )
      await removeTemporaryDownloads(directory)
      const fv1dir = await fs.readdir(path.join(directory, 'fake-version-1'))
      expect(fv1dir).toEqual(['something.md', 'something.zip'])
      const fv2dir = await fs.readdir(path.join(directory, 'fake-version-2'))
      expect(fv2dir).toEqual(['fakedl.zip'])
    })
  })
  it('should not throw if directories cant be read', async () => {
    await directoryWithCleanup(async directory => {
      await fs.writeFile(path.join(directory, 'something'), 'hi')
      await removeTemporaryDownloads(directory)
    })
  })
})
