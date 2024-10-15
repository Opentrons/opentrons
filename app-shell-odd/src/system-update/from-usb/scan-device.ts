import Semver from 'semver'
import { getVersionFromZipIfValid } from './scan-zip'
import type { FileDetails } from './scan-zip'

const higherVersion = (a: FileDetails | null, b: FileDetails): FileDetails =>
  a == null ? b : Semver.gt(a.version, b.version) ? a : b

const mostRecentUpdateOf = (candidates: FileDetails[]): FileDetails | null =>
  candidates.reduce<FileDetails | null>(
    (prev, current) => higherVersion(prev, current),
    null
  )

const getMassStorageUpdateFiles = (
  filePaths: string[]
): Promise<FileDetails[]> =>
  Promise.all(
    filePaths.map(path =>
      path.endsWith('.zip')
        ? getVersionFromZipIfValid(path).catch(() => null)
        : new Promise<null>(resolve => {
            resolve(null)
          })
    )
  ).then(values => values.filter(entry => entry != null) as FileDetails[])

export const getLatestMassStorageUpdateFile = (
  filePaths: string[]
): Promise<FileDetails | null> =>
  getMassStorageUpdateFiles(filePaths).then(mostRecentUpdateOf)
