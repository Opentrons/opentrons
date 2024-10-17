import StreamZip from 'node-stream-zip'
import Semver from 'semver'
import { createLogger } from '../../log'
import { REASONABLE_VERSION_FILE_SIZE_B, VERSION_FILENAME } from '../constants'

const log = createLogger('system-update/from-usb/scan-zip')

export interface FileDetails {
  path: string
  version: string
}

export const getVersionFromZipIfValid = (path: string): Promise<FileDetails> =>
  new Promise((resolve, reject) => {
    const zip = new StreamZip({ file: path, storeEntries: true })
    zip.on('ready', () => {
      log.info(`Reading zip from ${path}`)
      getVersionFromOpenedZipIfValid(zip)
        .then(version => {
          log.info(`Zip at ${path} has version ${version}`)
          zip.close()
          resolve({ version, path })
        })
        .catch(err => {
          log.info(
            `Zip at ${path} was read but could not be parsed: ${err.name}: ${err.message}`
          )
          zip.close()
          reject(err)
        })
    })
    zip.on('error', err => {
      log.info(`Zip at ${path} could not be read: ${err.name}: ${err.message}`)
      zip.close()
      reject(err)
    })
  })

export const getVersionFromOpenedZipIfValid = (
  zip: StreamZip
): Promise<string> =>
  new Promise((resolve, reject) => {
    const found = Object.values(zip.entries()).reduce((prev, entry) => {
      log.debug(
        `Checking if ${entry.name} is ${VERSION_FILENAME}, is a file (${entry.isFile}), and ${entry.size}<${REASONABLE_VERSION_FILE_SIZE_B}`
      )
      if (
        entry.isFile &&
        entry.name === VERSION_FILENAME &&
        entry.size < REASONABLE_VERSION_FILE_SIZE_B
      ) {
        log.debug(`${entry.name} is a version file candidate`)
        const contents = zip.entryDataSync(entry.name).toString('ascii')
        log.debug(`version contents: ${contents}`)
        try {
          const parsedContents = JSON.parse(contents)
          if (parsedContents?.robot_type !== 'OT-3 Standard') {
            reject(new Error('not a Flex release file'))
          }
          const fileVersion = parsedContents?.opentrons_api_version
          const version = Semver.valid(fileVersion as string)
          if (version === null) {
            reject(new Error(`${fileVersion} is not a valid version`))
            return prev
          } else {
            log.info(`Found version file version ${version}`)
            resolve(version)
            return true
          }
        } catch (err: any) {
          if (err instanceof Error) {
            log.error(
              `Failed to read ${entry.name}: ${err.name}: ${err.message}`
            )
          } else {
            log.error(`Failed to ready ${entry.name}: ${err}`)
          }
          reject(err)
          return prev
        }
      } else {
        return prev
      }
    }, false)
    if (!found) {
      reject(new Error('No version file found in zip'))
    }
  })
