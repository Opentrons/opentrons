import { when, resetAllWhenMocks } from 'jest-when'
import fse from 'fs-extra'
import * as Http from '../../http'
import * as Dirs from '../directories'
import { downloadAndCacheReleaseManifest } from '../release-manifest'

jest.mock('fs-extra')
jest.mock('../../http')
jest.mock('../directories')

const fetchJson = Http.fetchJson as jest.MockedFunction<typeof Http.fetchJson>
const outputJson = fse.outputJson as jest.MockedFunction<typeof fse.outputJson>
const readJson = fse.readJson as jest.MockedFunction<typeof fse.readJson>
const getManifestCacheDir = Dirs.getManifestCacheDir as jest.MockedFunction<
  typeof Dirs.getManifestCacheDir
>
const MOCK_DIR = 'mock_dir'
const MANIFEST_URL = 'http://example.com/releases.json'
const MOCK_MANIFEST = {}

describe('release manifest utilities', () => {
  beforeEach(() => {
    getManifestCacheDir.mockReturnValue(MOCK_DIR)
    when(fetchJson).calledWith(MANIFEST_URL).mockResolvedValue(MOCK_MANIFEST)
    when(outputJson)
      // @ts-expect-error outputJson takes additional optional arguments which is tweaking jest-when
      .calledWith(MOCK_DIR, MOCK_MANIFEST)
      // @ts-expect-error outputJson takes additional optional arguments which is tweaking jest-when
      .mockResolvedValue()
    when(readJson)
      // @ts-expect-error readJson takes additional optional arguments which is tweaking jest-when
      .calledWith(MOCK_DIR)
      // @ts-expect-error readJson takes additional optional arguments which is tweaking jest-when
      .mockResolvedValue(MOCK_MANIFEST)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('should download and save the manifest from a url', () => {
    return downloadAndCacheReleaseManifest(MANIFEST_URL).then(manifest => {
      expect(manifest).toBe(MOCK_MANIFEST)
      expect(outputJson).toHaveBeenCalledWith(MOCK_DIR, MOCK_MANIFEST)
    })
  })

  it('should pull the manifest from the file if the manifest download fails', () => {
    when(fetchJson).calledWith(MANIFEST_URL).mockRejectedValue('oh no!')
    return downloadAndCacheReleaseManifest(MANIFEST_URL).then(manifest =>
      expect(manifest).toBe(MOCK_MANIFEST)
    )
  })
})
