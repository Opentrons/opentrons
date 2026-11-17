import { afterEach, describe, expect, it, vi } from 'vitest'

import { getLatestMassStorageUpdateFile } from '../scan-device'
import { getVersionFromZipIfValid as _getVersionFromZipIfValid } from '../scan-zip'

vi.mock('../../../log')
vi.mock('../scan-zip')
const getVersionFromZipIfValid = vi.mocked(_getVersionFromZipIfValid)

describe('system-update/from-usb/scan-device', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('returns the single file passed in', () => {
    vi.when(getVersionFromZipIfValid)
      .calledWith('/some/random/zip/file.zip')
      .thenResolve({ path: '/some/random/zip/file.zip', version: '0.0.1' })
    return expect(
      getLatestMassStorageUpdateFile(['/some/random/zip/file.zip'])
    ).resolves.toEqual({ path: '/some/random/zip/file.zip', version: '0.0.1' })
  })
  it('returns null if no files are passed in', () =>
    expect(getLatestMassStorageUpdateFile([])).resolves.toBeNull())
  it('returns null if no suitable zips are found', () => {
    vi.when(getVersionFromZipIfValid)
      .calledWith('/some/random/zip/file.zip')
      .thenReject(new Error('no version found'))
    return expect(
      getLatestMassStorageUpdateFile(['/some/random/zip/file.zip'])
    ).resolves.toBeNull()
  })
  it('checks only the zip file', () => {
    vi.when(getVersionFromZipIfValid)
      .calledWith('/some/random/zip/file.zip')
      .thenResolve({ path: '/some/random/zip/file.zip', version: '0.0.1' })
    return expect(
      getLatestMassStorageUpdateFile([
        '/some/random/zip/file.zip',
        '/some/other/random/file',
      ])
    )
      .resolves.toEqual({ path: '/some/random/zip/file.zip', version: '0.0.1' })
      .then(() => expect(getVersionFromZipIfValid).toHaveBeenCalledOnce())
  })
  it('returns the highest version', () => {
    vi.when(getVersionFromZipIfValid)
      .calledWith('higher-version.zip')
      .thenResolve({ path: 'higher-version.zip', version: '1.0.0' })
    vi.when(getVersionFromZipIfValid)
      .calledWith('lower-version.zip')
      .thenResolve({ path: 'higher-version.zip', version: '1.0.0-alpha.0' })
    return expect(
      getLatestMassStorageUpdateFile([
        'higher-version.zip',
        'lower-version.zip',
      ])
    ).resolves.toEqual({ path: 'higher-version.zip', version: '1.0.0' })
  })
})
