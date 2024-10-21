// system update handler

import Semver from 'semver'

import { CONFIG_INITIALIZED, VALUE_UPDATED } from '../constants'
import { createLogger } from '../log'
import { postFile } from '../http'
import { getConfig } from '../config'
import { getSystemUpdateDir } from './directories'
import { SYSTEM_FILENAME, FLEX_MANIFEST_URL } from './constants'
import { getProvider as getWebUpdateProvider } from './from-web'
import { getProvider as getUsbUpdateProvider } from './from-usb'

import type { Action, Dispatch } from '../types'
import type { UpdateProvider, UnresolvedUpdate, ReadyUpdate } from './types'
import type { USBUpdateSource } from './from-usb'

export const CURRENT_SYSTEM_VERSION = _PKG_VERSION_

const log = createLogger('system-update/handler')

export interface UpdateDriver {
  handleAction: (action: Action) => Promise<void>
  reload: () => Promise<void>
  shouldReload: () => boolean
  teardown: () => Promise<void>
}

export function createUpdateDriver(dispatch: Dispatch): UpdateDriver {
  log.info(`Running robot system updates storing to ${getSystemUpdateDir()}`)

  let webUpdate: UnresolvedUpdate = {
    version: null,
    files: null,
    releaseNotes: null,
    downloadProgress: 0,
  }
  let webProvider = getWebUpdateProvider({
    manifestUrl: FLEX_MANIFEST_URL,
    channel: getConfig('update').channel,
    updateCacheDirectory: getSystemUpdateDir(),
    currentVersion: CURRENT_SYSTEM_VERSION,
  })
  const usbProviders: Record<string, UpdateProvider<USBUpdateSource>> = {}
  let currentBestUsbUpdate:
    | (ReadyUpdate & { providerName: string })
    | null = null

  const updateBestUsbUpdate = (): void => {
    currentBestUsbUpdate = null
    Object.values(usbProviders).forEach(provider => {
      const providerUpdate = provider.getUpdateDetails()
      if (providerUpdate.files == null) {
        // nothing to do, keep null
      } else if (currentBestUsbUpdate == null) {
        currentBestUsbUpdate = {
          ...(providerUpdate as ReadyUpdate),
          providerName: provider.name(),
        }
      } else if (
        Semver.gt(providerUpdate.version, currentBestUsbUpdate.version)
      ) {
        currentBestUsbUpdate = {
          ...(providerUpdate as ReadyUpdate),
          providerName: provider.name(),
        }
      }
    })
  }

  const dispatchStaticUpdateData = (): void => {
    if (currentBestUsbUpdate != null) {
      dispatchUpdateInfo(
        {
          version: currentBestUsbUpdate.version,
          releaseNotes: currentBestUsbUpdate.releaseNotes,
          force: true,
        },
        dispatch
      )
    } else {
      dispatchUpdateInfo(
        {
          version: webUpdate.version,
          releaseNotes: webUpdate.releaseNotes,
          force: false,
        },
        dispatch
      )
    }
  }

  return {
    handleAction: (action: Action): Promise<void> => {
      switch (action.type) {
        case 'shell:CHECK_UPDATE':
          return webProvider
            .refreshUpdateCache(updateStatus => {
              webUpdate = updateStatus
              if (currentBestUsbUpdate == null) {
                if (
                  updateStatus.version != null &&
                  updateStatus.files == null &&
                  updateStatus.downloadProgress === 0
                ) {
                  dispatch({
                    type: 'robotUpdate:UPDATE_VERSION',
                    payload: {
                      version: updateStatus.version,
                      force: false,
                      target: 'flex',
                    },
                  })
                } else if (
                  updateStatus.version != null &&
                  updateStatus.files == null &&
                  updateStatus.downloadProgress !== 0
                ) {
                  dispatch({
                    // TODO: change this action type to 'systemUpdate:DOWNLOAD_PROGRESS'
                    type: 'robotUpdate:DOWNLOAD_PROGRESS',
                    payload: {
                      progress: updateStatus.downloadProgress,
                      target: 'flex',
                    },
                  })
                } else if (updateStatus.files != null) {
                  dispatchStaticUpdateData()
                }
              }
            })
            .catch(err => {
              log.warn(
                `Error finding updates with ${webProvider.name()}: ${
                  err.name
                }: ${err.message}`
              )
              return {
                version: null,
                files: null,
                downloadProgress: 0,
                releaseNotes: null,
              } as const
            })
            .then(result => {
              webUpdate = result
              dispatchStaticUpdateData()
            })
        case 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED':
          log.info(
            `mass storage device enumerated at ${action.payload.rootPath}`
          )
          if (usbProviders[action.payload.rootPath] != null) {
            return new Promise(resolve => {
              resolve()
            })
          }
          usbProviders[action.payload.rootPath] = getUsbUpdateProvider({
            currentVersion: CURRENT_SYSTEM_VERSION,
            massStorageDeviceRoot: action.payload.rootPath,
            massStorageDeviceFiles: action.payload.filePaths,
          })
          return usbProviders[action.payload.rootPath]
            .refreshUpdateCache(() => {})
            .then(() => {
              updateBestUsbUpdate()
              dispatchStaticUpdateData()
            })
            .catch(err => {
              log.error(
                `Failed to get updates from ${action.payload.rootPath}: ${err.name}: ${err.message}`
              )
            })

        case 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED':
          log.info(`mass storage removed at ${action.payload.rootPath}`)
          const provider = usbProviders[action.payload.rootPath]
          if (provider != null) {
            return provider
              .teardown()
              .then(() => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete usbProviders[action.payload.rootPath]
                updateBestUsbUpdate()
              })
              .catch(err => {
                log.error(
                  `Failed to tear down provider ${provider.name()}: ${
                    err.name
                  }: ${err.message}`
                )
              })
              .then(() => {
                dispatchStaticUpdateData()
              })
          }
          return new Promise(resolve => {
            resolve()
          })
        case 'robotUpdate:UPLOAD_FILE': {
          const { host, path, systemFile } = action.payload
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          return postFile(
            `http://${host.ip}:${host.port}${path}`,
            SYSTEM_FILENAME,
            systemFile
          )
            .then(() => ({
              type: 'robotUpdate:FILE_UPLOAD_DONE' as const,
              payload: host.name,
            }))
            .catch((error: Error) => {
              log.warn('Error uploading update to robot', {
                path,
                systemFile,
                error,
              })

              return {
                type: 'robotUpdate:UNEXPECTED_ERROR' as const,
                payload: {
                  message: `Error uploading update to robot: ${error.message}`,
                },
              }
            })
            .then(dispatch)
        }
        case 'robotUpdate:READ_SYSTEM_FILE': {
          const getDetails = (): {
            systemFile: string
            version: string
            isManualFile: false
          } | null => {
            if (currentBestUsbUpdate) {
              return {
                systemFile: currentBestUsbUpdate.files.system,
                version: currentBestUsbUpdate.version,
                isManualFile: false,
              }
            } else if (webUpdate.files?.system != null) {
              return {
                systemFile: webUpdate.files.system,
                version: webUpdate.version as string, // version is string if files is not null
                isManualFile: false,
              }
            } else {
              return null
            }
          }
          return new Promise(resolve => {
            const details = getDetails()
            if (details == null) {
              dispatch({
                type: 'robotUpdate:UNEXPECTED_ERROR',
                payload: { message: 'System update file not downloaded' },
              })
              resolve()
              return
            }

            dispatch({
              type: 'robotUpdate:FILE_INFO' as const,
              payload: details,
            })
            resolve()
          })
        }
        case 'robotUpdate:READ_USER_FILE': {
          return new Promise(resolve => {
            dispatch({
              type: 'robotUpdate:UNEXPECTED_ERROR',
              payload: {
                message: 'Updates of this kind are not implemented for ODD',
              },
            })
            resolve()
          })
        }
      }
      return new Promise(resolve => {
        resolve()
      })
    },
    reload: () => {
      webProvider.lockUpdateCache()
      return webProvider
        .teardown()
        .catch(err => {
          log.error(
            `Failed to tear down web provider ${webProvider.name()}: ${
              err.name
            }: ${err.message}`
          )
        })
        .then(() => {
          webProvider = getWebUpdateProvider({
            manifestUrl: FLEX_MANIFEST_URL,
            channel: getConfig('update').channel,
            updateCacheDirectory: getSystemUpdateDir(),
            currentVersion: CURRENT_SYSTEM_VERSION,
          })
        })
        .catch(err => {
          const message = `System updates failed to handle config change: ${err.name}: ${err.message}`
          log.error(message)
          dispatch({
            type: 'robotUpdate:UNEXPECTED_ERROR',
            payload: { message: message },
          })
        })
    },
    shouldReload: () =>
      getConfig('update').channel !== webProvider.source().channel,
    teardown: () => {
      return Promise.allSettled([
        webProvider.teardown(),
        ...Object.values(usbProviders).map(provider => provider.teardown()),
      ])
        .catch(errs => {
          log.error(`Failed to tear down some providers: ${errs}`)
        })
        .then(results => {
          log.info('all providers torn down')
        })
    },
  }
}

export interface UpdatableDriver {
  getUpdateDriver: () => UpdateDriver | null
  handleAction: (action: Action) => Promise<void>
}

export function manageDriver(dispatch: Dispatch): UpdatableDriver {
  let updateDriver: UpdateDriver | null = null
  return {
    handleAction: action => {
      if (action.type === CONFIG_INITIALIZED) {
        log.info('Initializing update driver')
        return new Promise(resolve => {
          updateDriver = createUpdateDriver(dispatch)
          resolve()
        })
      } else if (updateDriver != null) {
        if (action.type === VALUE_UPDATED && updateDriver.shouldReload()) {
          return updateDriver.reload()
        } else {
          return updateDriver.handleAction(action)
        }
      } else {
        return new Promise(resolve => {
          log.warn(
            `update driver manager received action ${action.type} before initialization`
          )
          resolve()
        })
      }
    },
    getUpdateDriver: () => updateDriver,
  }
}

export function registerRobotSystemUpdate(dispatch: Dispatch): Dispatch {
  return manageDriver(dispatch).handleAction
}

const dispatchUpdateInfo = (
  info: { version: string | null; releaseNotes: string | null; force: boolean },
  dispatch: Dispatch
): void => {
  const { version, releaseNotes, force } = info
  dispatch({
    type: 'robotUpdate:UPDATE_INFO',
    payload: { releaseNotes, version, force, target: 'flex' },
  })
  dispatch({
    type: 'robotUpdate:UPDATE_VERSION',
    payload: { version, force, target: 'flex' },
  })
}
