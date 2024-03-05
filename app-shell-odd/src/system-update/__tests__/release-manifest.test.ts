import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import * as Http from '../../http'
import * as Dirs from '../directories'
import { downloadAndCacheReleaseManifest } from '../release-manifest'

vi.mock('../../http')
vi.mock('../directories')
vi.mock('../../log')
vi.mock('electron-store')
const fetchJson = Http.fetchJson
const getManifestCacheDir = Dirs.getManifestCacheDir

const MOCK_DIR = 'mock_dir'
const MANIFEST_URL = 'http://example.com/releases.json'
const MOCK_MANIFEST = {} as any

describe('release manifest utilities', () => {
  beforeEach(() => {
    vi.mocked(getManifestCacheDir).mockReturnValue(MOCK_DIR)
    vi.mocked(fetchJson).mockResolvedValue(MOCK_MANIFEST)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should download and save the manifest from a url', async () => {
    await expect(
      downloadAndCacheReleaseManifest(MANIFEST_URL)
    ).resolves.toEqual(MOCK_MANIFEST)
    expect(fetchJson).toHaveBeenCalledWith(MANIFEST_URL)
  })

  it('should pull the manifest from the file if the manifest download fails', async () => {
    const error = new Error('Failed to download')
    vi.mocked(fetchJson).mockRejectedValue(error)
    await expect(
      downloadAndCacheReleaseManifest(MANIFEST_URL)
    ).resolves.toEqual(MOCK_MANIFEST)
    expect(fetchJson).toHaveBeenCalledWith(MANIFEST_URL)
  })
})
