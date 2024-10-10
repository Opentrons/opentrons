import StreamZip from 'node-stream-zip'
import Semver from 'semver'

import { REASONABLE_VERSION_FILE_SIZE_B, VERSION_FILENAME } from '../constants'

export interface FileDetails {
  path: string
  version: string
}

export const getVersionFromZipIfValid = (path: string): Promise<FileDetails> =>
  new Promise((resolve, reject) => {
    const zip = new StreamZip({ file: path, storeEntries: true })
    zip.on('ready', () => {
      getVersionFromOpenedZipIfValid(zip)
        .then(version => {
          zip.close()
          resolve({ version, path })
        })
        .catch(err => {
          zip.close()
          reject(err)
        })
    })
    zip.on('error', err => {
      zip.close()
      reject(err)
    })
  })

export const getVersionFromOpenedZipIfValid = (
  zip: StreamZip
): Promise<string> =>
  new Promise((resolve, reject) => {
    Object.values(zip.entries()).forEach(entry => {
      if (
        entry.isFile &&
        entry.name === VERSION_FILENAME &&
        entry.size < REASONABLE_VERSION_FILE_SIZE_B
      ) {
        const contents = zip.entryDataSync(entry.name).toString('ascii')
        try {
          const parsedContents = JSON.parse(contents)
          if (parsedContents?.robot_type !== 'OT-3 Standard') {
            reject(new Error('not a Flex release file'))
          }
          const fileVersion = parsedContents?.opentrons_api_version
          const version = Semver.valid(fileVersion as string)
          if (version === null) {
            reject(new Error(`${fileVersion} is not a valid version`))
          } else {
            resolve(version)
          }
        } catch (error) {
          reject(error)
        }
      }
      reject(new Error('No version file found in zip'))
    })
  })
