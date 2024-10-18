import { it, describe, expect, vi } from 'vitest'
import path from 'path'
import { exec as _exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir } from 'fs/promises'
import { REASONABLE_VERSION_FILE_SIZE_B } from '../../constants'
import { directoryWithCleanup } from '../../utils'
import { getVersionFromZipIfValid } from '../scan-zip'

vi.mock('../../../log')
const exec = promisify(_exec)

const zipCommand = (
  tempDir: string,
  zipName?: string,
  zipContentSubDirectory?: string
): string =>
  `zip -j ${path.join(tempDir, zipName ?? 'test.zip')} ${path.join(
    tempDir,
    zipContentSubDirectory ?? 'test',
    '*'
  )}`

describe('system-update/from-usb/scan-zip', () => {
  it('should read version data from a valid zip file', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() =>
          writeFile(
            path.join(directory, 'test', 'VERSION.json'),
            JSON.stringify({
              robot_type: 'OT-3 Standard',
              opentrons_api_version: '1.2.3',
            })
          )
        )
        .then(() => exec(zipCommand(directory)))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).resolves.toEqual({
            path: path.join(directory, 'test.zip'),
            version: '1.2.3',
          })
        )
    ))

  it('should throw if there is no version file', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() => writeFile(path.join(directory, 'test', 'dummy'), 'lalala'))
        .then(() => exec(zipCommand(directory)))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
  it('should throw if the version file is too big', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() =>
          writeFile(
            path.join(directory, 'test', 'VERSION.json'),
            `{data: "${'a'.repeat(REASONABLE_VERSION_FILE_SIZE_B + 1)}"}`
          )
        )
        .then(() =>
          exec(
            `head -c ${
              REASONABLE_VERSION_FILE_SIZE_B + 1
            } /dev/zero > ${path.join(directory, 'test', 'VERSION.json')} `
          )
        )
        .then(() => exec(zipCommand(directory)))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
  it('should throw if the version file is not valid json', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() =>
          writeFile(path.join(directory, 'test', 'VERSION.json'), 'asdaasdas')
        )
        .then(() => exec(zipCommand(directory)))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
  it('should throw if the version file is for OT-2', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() =>
          writeFile(
            path.join(directory, 'test', 'VERSION.json'),
            JSON.stringify({
              robot_type: 'OT-2 Standard',
              opentrons_api_version: '1.2.3',
            })
          )
        )
        .then(() => exec(zipCommand(directory)))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
  it('should throw if not given a zip file', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() => writeFile(path.join(directory, 'test.zip'), 'aosidasdasd'))
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
  it('should throw if given a zip file with internal directories', () =>
    directoryWithCleanup(directory =>
      mkdir(path.join(directory, 'test'))
        .then(() =>
          writeFile(
            path.join(directory, 'test', 'VERSION.json'),
            JSON.stringify({
              robot_type: 'OT-3 Standard',
              opentrons_api_version: '1.2.3',
            })
          )
        )
        .then(() =>
          exec(
            `zip ${path.join(directory, 'test.zip')} ${path.join(
              directory,
              'test',
              '*'
            )}`
          )
        )
        .then(() =>
          expect(
            getVersionFromZipIfValid(path.join(directory, 'test.zip'))
          ).rejects.toThrow()
        )
    ))
})
