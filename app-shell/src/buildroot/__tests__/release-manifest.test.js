// @flow
import fse from 'fs-extra'
import tempy from 'tempy'
import * as Http from '../../http'
import { downloadManifest } from '../release-manifest'

jest.mock('../../http')

const fetchJson: JestMockFn<[string], mixed> = Http.fetchJson

describe('release manifest utilities', () => {
  let manifestFile

  beforeEach(() => {
    manifestFile = tempy.file({ extension: 'json' })
  })

  afterEach(() => {
    return fse.remove(manifestFile)
  })

  it('should download the manifest from a url', () => {
    const result = { mockResult: true }
    const manifestUrl = 'http://example.com/releases.json'

    fetchJson.mockImplementation(url => {
      if (url === manifestUrl) return Promise.resolve(result)
    })

    return expect(downloadManifest(manifestUrl, manifestFile)).resolves.toBe(
      result
    )
  })

  it('should save the manifest to the given path', () => {
    const result = { mockResult: true }
    const manifestUrl = 'http://example.com/releases.json'

    fetchJson.mockResolvedValue(result)

    return downloadManifest(manifestUrl, manifestFile)
      .then(() => fse.readJson(manifestFile))
      .then(file => expect(file).toEqual(result))
  })

  it('should pull the manifest from the file if the manifest download fails', () => {
    const manifest = { mockResult: true }
    const manifestUrl = 'http://example.com/releases.json'

    fse.writeJsonSync(manifestFile, manifest)
    fetchJson.mockRejectedValue(new Error('AH'))

    return downloadManifest(manifestUrl, manifestFile).then(result =>
      expect(result).toEqual(manifest)
    )
  })
})
