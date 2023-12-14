import {
  RobotMassStorageDeviceAdded,
  RobotMassStorageDeviceEnumerated,
  RobotMassStorageDeviceRemoved,
} from './types'

export const ROBOT_MASS_STORAGE_DEVICE_ADDED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED'
export const ROBOT_MASS_STORAGE_DEVICE_REMOVED: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED'
export const ROBOT_MASS_STORAGE_DEVICE_ENUMERATED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED'

export const robotMassStorageDeviceRemoved = (
  rootPath: string
): RobotMassStorageDeviceRemoved => ({
  type: ROBOT_MASS_STORAGE_DEVICE_REMOVED,
  payload: {
    rootPath,
  },
  meta: { shell: true },
})

export const robotMassStorageDeviceAdded = (
  rootPath: string
): RobotMassStorageDeviceAdded => ({
  type: ROBOT_MASS_STORAGE_DEVICE_ADDED,
  payload: {
    rootPath,
  },
  meta: { shell: true },
})

export const robotMassStorageDeviceEnumerated = (
  rootPath: string,
  filePaths: string[]
): RobotMassStorageDeviceEnumerated => ({
  type: ROBOT_MASS_STORAGE_DEVICE_ENUMERATED,
  payload: {
    rootPath,
    filePaths,
  },
  meta: { shell: true },
})
