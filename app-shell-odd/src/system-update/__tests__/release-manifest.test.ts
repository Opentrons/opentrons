import { describe, it, vi, beforeEach, afterEach } from 'vitest'
import fse from 'fs-extra'
import * as Http from '../../http'
import * as Dirs from '../directories'
import { downloadAndCacheReleaseManifest } from '../release-manifest'

vi.mock('fs-extra')
vi.mock('../../http')
vi.mock('../directories')

const fetchJson = Http.fetchJson
const outputJson = fse.outputJson
const readJson = fse.readJson
const getManifestCacheDir = Dirs.getManifestCacheDir

const MOCK_DIR = 'mock_dir'
const MANIFEST_URL = 'http://example.com/releases.json'
const MOCK_MANIFEST = {}

describe('release manifest utilities', () => {
  beforeEach(() => {
    vi.mocked(getManifestCacheDir).mockReturnValue(MOCK_DIR)
    vi.mocked(fetchJson).mockResolvedValue(MOCK_MANIFEST)
    vi.mocked(outputJson).mockResolvedValue()
    vi.mocked(readJson)
      // @ts-expect-error readJson takes additional optional arguments which is tweaking jest-when
      .mockResolvedValue(MOCK_MANIFEST)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should download and save the manifest from a url', () => {
    return downloadAndCacheReleaseManifest(MANIFEST_URL).then(manifest => {
      expect(manifest).toBe(MOCK_MANIFEST)
      expect(outputJson).toHaveBeenCalledWith(MOCK_DIR, MOCK_MANIFEST)
    })
  })

  it('should pull the manifest from the file if the manifest download fails', () => {
    vi.mocked(fetchJson).mockRejectedValue('oh no!')
    return downloadAndCacheReleaseManifest(MANIFEST_URL).then(manifest =>
      expect(manifest).toBe(MOCK_MANIFEST)
    )
  })
})
