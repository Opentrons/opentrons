import { describe, it, expect, vi, afterEach } from 'vitest'
import { when } from 'vitest-when'

import { getVersionFromZipIfValid as _getVersionFromZipIfValid } from '../scan-zip'
import { getLatestMassStorageUpdateFile } from '../scan-device'
vi.mock('../../../log')
vi.mock('../scan-zip')
const getVersionFromZipIfValid = vi.mocked(_getVersionFromZipIfValid)

describe('system-update/from-usb/scan-device', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('returns the single file passed in', () => {
    when(getVersionFromZipIfValid)
      .calledWith('/some/random/zip/file.zip')
      .thenResolve({ path: '/some/random/zip/file.zip', version: '0.0.1' })
    return expect(
      getLatestMassStorageUpdateFile(['/some/random/zip/file.zip'])
    ).resolves.toEqual({ path: '/some/random/zip/file.zip', version: '0.0.1' })
  })
  it('returns null if no files are passed in', () =>
    expect(getLatestMassStorageUpdateFile([])).resolves.toBeNull())
  it('returns null if no suitable zips are found', () => {
    when(getVersionFromZipIfValid)
      .calledWith('/some/random/zip/file.zip')
      .thenReject(new Error('no version found'))
    return expect(
      getLatestMassStorageUpdateFile(['/some/random/zip/file.zip'])
    ).resolves.toBeNull()
  })
  it('checks only the zip file', () => {
    when(getVersionFromZipIfValid)
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
    when(getVersionFromZipIfValid)
      .calledWith('higher-version.zip')
      .thenResolve({ path: 'higher-version.zip', version: '1.0.0' })
    when(getVersionFromZipIfValid)
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
