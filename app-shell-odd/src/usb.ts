import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import { join } from 'path'
import { flatten } from 'lodash'
import type { Dispatch } from './types'
import {
  robotMassStorageDeviceAdded,
  robotMassStorageDeviceEnumerated,
  robotMassStorageDeviceRemoved,
} from '@opentrons/app/src/redux/shell/actions'
const FLEX_USB_MOUNT_DIR = '/media/'
const FLEX_USB_MOUNT_FILTER = /sd[a-z][0-9]$/
const MOUNT_ENUMERATION_DELAY_MS = 1000

const enumerateMassStorage = (path: string): Promise<string[]> =>
  fsPromises
    .readdir(path)
    .then(entries =>
      entries.length === 0
        ? new Promise<void>(resolve =>
            setTimeout(resolve, MOUNT_ENUMERATION_DELAY_MS)
          )
        : new Promise<void>(resolve => resolve())
    )
    .then(() => fsPromises.readdir(path, { withFileTypes: true }))
    .then(entries =>
      Promise.all(
        entries.map(entry =>
          entry.isDirectory()
            ? enumerateMassStorage(join(path, entry.name))
            : new Promise<string[]>(resolve =>
                resolve([join(path, entry.name)])
              )
        )
      )
    )
    .catch(() => [])
    .then(flatten)

export function watchForMassStorage(dispatch: Dispatch): () => void {
  console.log('watching for mass storage')
  let prevDirs: string[] = []
  const handleNewlyPresent = (path: string): Promise<string> => {
    dispatch(robotMassStorageDeviceAdded(path))
    return enumerateMassStorage(path)
      .then(contents => {
        dispatch(robotMassStorageDeviceEnumerated(path, contents))
      })
      .then(() => path)
  }

  const rescan = (dispatch: Dispatch): Promise<unknown> =>
    fsPromises
      .readdir(FLEX_USB_MOUNT_DIR)
      .then(entries => {
        const sortedEntries = entries.sort()
        const newlyPresent = sortedEntries.filter(
          entry => !prevDirs.includes(entry)
        )
        const newlyAbsent = prevDirs.filter(
          entry => !sortedEntries.includes(entry)
        )
        return Promise.all([
          ...newlyAbsent.map(entry => {
            if (entry.match(FLEX_USB_MOUNT_FILTER)) {
              dispatch(
                robotMassStorageDeviceRemoved(join(FLEX_USB_MOUNT_DIR, entry))
              )
            }
            return null
          }),
          ...newlyPresent.map(entry => {
            if (entry.match(FLEX_USB_MOUNT_FILTER)) {
              return handleNewlyPresent(join(FLEX_USB_MOUNT_DIR, entry))
            }
            return null
          }),
        ])
      })
      .then(present => {
        prevDirs = present.filter((entry): entry is string => entry !== null)
      })

  const watcher = fs.watch(
    FLEX_USB_MOUNT_DIR,
    { persistent: true },
    (event, fileName) => {
      if (!!!fileName) {
        rescan(dispatch)
        return
      }
      if (!fileName.match(FLEX_USB_MOUNT_FILTER)) {
        return
      }
      const fullPath = join(FLEX_USB_MOUNT_DIR, fileName)
      fsPromises
        .stat(fullPath)
        .then(info => {
          if (!info.isDirectory) {
            return
          }
          if (prevDirs.includes(fileName)) {
            return
          }
          console.log(`New mass storage device ${fileName} detected`)
          prevDirs.push(fileName)
          return handleNewlyPresent(fullPath)
        })
        .catch(() => {
          if (prevDirs.includes(fileName)) {
            console.log(`Mass storage device at ${fileName} removed`)
            prevDirs = prevDirs.filter(entry => entry !== fileName)
            dispatch(robotMassStorageDeviceRemoved(fullPath))
          }
        })
    }
  )

  rescan(dispatch)
  return () => {
    watcher.close()
  }
}
