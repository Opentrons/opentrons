import { describe, it, vi, expect } from 'vitest'
import { when } from 'vitest-when'
import path from 'path'
import { readdir, writeFile, mkdir, readFile } from 'fs/promises'
import { fetchJson as _fetchJson } from '../../../http'
import { ensureCacheDir, getOrDownloadManifest } from '../release-manifest'
import { directoryWithCleanup } from '../../utils'

vi.mock('../../../http')
// note: this doesn't look like it's needed but it is because http uses log
vi.mock('../../../log')
const fetchJson = vi.mocked(_fetchJson)

const MOCK_MANIFEST = {
  production: {
    '1.2.3': {
      fullImage: 'https://opentrons.com/no',
      system: 'https://opentrons.com/no2',
      version: 'https://opentrons.com/no3',
      releaseNotes: 'https://opentrons.com/no4',
    },
  },
}

describe('ensureCacheDirectory', () => {
  it('should create the cache directory if it or its parents do not exist', () =>
    directoryWithCleanup(directory =>
      ensureCacheDir(
        path.join(directory as string, 'somerandomname', 'someotherrandomname')
      )
        .then(ensuredDirectory => {
          expect(ensuredDirectory).toEqual(
            path.join(directory, 'somerandomname', 'someotherrandomname')
          )
          return readdir(path.join(directory, 'somerandomname'), {
            withFileTypes: true,
          })
        })
        .then(contents => {
          expect(contents).toHaveLength(1)
          expect(contents[0].isDirectory()).toBeTruthy()
          expect(contents[0].name).toEqual('someotherrandomname')
          return readdir(path.join(contents[0].path, contents[0].name))
        })
        .then(contents => {
          expect(contents).toHaveLength(0)
        })
    ))
  it('should delete and recreate the cache directory if it is a file', () =>
    directoryWithCleanup(directory =>
      writeFile(path.join(directory, 'somerandomname'), 'alsdasda')
        .then(() => ensureCacheDir(path.join(directory, 'somerandomname')))
        .then(ensuredDirectory => {
          expect(ensuredDirectory).toEqual(
            path.join(directory, 'somerandomname')
          )
          return readdir(directory, { withFileTypes: true })
        })
        .then(contents => {
          expect(contents).toHaveLength(1)
          expect(contents[0].isDirectory()).toBeTruthy()
          expect(contents[0].name).toEqual('somerandomname')
          return readdir(path.join(contents[0].path, contents[0].name))
        })
        .then(contents => {
          expect(contents).toHaveLength(0)
        })
    ))

  it('should remove a non-file with the same name as the manifest file', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'somerandomname', 'manifest.json'), {
        recursive: true,
      })
        .then(() =>
          writeFile(
            path.join(directory, 'somerandomname', 'testfile'),
            'testdata'
          )
        )
        .then(() => ensureCacheDir(path.join(directory, 'somerandomname')))
        .then(ensuredDirectory => readdir(ensuredDirectory))
        .then(contents => {
          expect(contents).not.toContain('manifest.json')
          return readFile(path.join(directory, 'somerandomname', 'testfile'), {
            encoding: 'utf-8',
          })
        })
        .then(contents => expect(contents).toEqual('testdata'))
    ))

  it('should preserve extra contents of the directory if the directory exists', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'somerandomname'), { recursive: true })
        .then(() =>
          writeFile(
            path.join(directory, 'somerandomname', 'somerandomfile'),
            'somerandomdata'
          )
        )
        .then(() => ensureCacheDir(path.join(directory, 'somerandomname')))
        .then(ensuredDirectory => {
          expect(ensuredDirectory).toEqual(
            path.join(directory, 'somerandomname')
          )
          return readFile(
            path.join(directory, 'somerandomname', 'somerandomfile'),
            { encoding: 'utf-8' }
          )
        })
        .then(contents => {
          expect(contents).toEqual('somerandomdata')
          return readdir(directory)
        })
        .then(contents => expect(contents).toEqual(['somerandomname']))
    ))
})

describe('getOrDownloadManifest', () => {
  const localManifest = {
    production: {
      '4.5.6': {
        fullImage: 'https://opentrons.com/no',
        system: 'https://opentrons.com/no2',
        version: 'https://opentrons.com/no3',
        releaseNotes: 'https://opentrons.com/no4',
      },
    },
  }
  it('should download a new manifest if possible', () =>
    directoryWithCleanup(directory =>
      writeFile(
        path.join(directory, 'manifest.json'),
        JSON.stringify(localManifest)
      )
        .then(() => {
          when(fetchJson)
            .calledWith(
              'http://opentrons.com/releases.json',
              expect.any(Object)
            )
            .thenResolve(MOCK_MANIFEST)
          return getOrDownloadManifest(
            'http://opentrons.com/releases.json',
            directory,
            new AbortController()
          )
        })
        .then(manifest => expect(manifest).toEqual(MOCK_MANIFEST))
    ))
  it('should use a cached manifest if the download fails', () =>
    directoryWithCleanup(directory =>
      writeFile(
        path.join(directory, 'manifest.json'),
        JSON.stringify(localManifest)
      )
        .then(() => {
          when(fetchJson)
            .calledWith(
              'http://opentrons.com/releases.json',
              expect.any(Object)
            )
            .thenReject(new Error('oh no!'))
          return getOrDownloadManifest(
            'http://opentrons.com/releases.json',
            directory,
            new AbortController()
          )
        })
        .then(manifest => expect(manifest).toEqual(localManifest))
    ))
  it('should reject if no manifest is available', () =>
    directoryWithCleanup(directory => {
      when(fetchJson)
        .calledWith('http://opentrons.com/releases.json', expect.any(Object))
        .thenReject(new Error('oh no!'))
      return expect(
        getOrDownloadManifest(
          'http://opentrons.com/releases.json',
          directory,
          new AbortController()
        )
      ).rejects.toThrow()
    }))
})
