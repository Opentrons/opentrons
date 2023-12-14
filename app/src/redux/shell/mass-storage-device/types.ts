export interface RobotMassStorageDeviceAdded {
  type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED'
  payload: {
    rootPath: string
  }
  meta: { shell: true }
}

export interface RobotMassStorageDeviceEnumerated {
  type: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED'
  payload: {
    rootPath: string
    filePaths: string[]
  }
  meta: { shell: true }
}

export interface RobotMassStorageDeviceRemoved {
  type: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED'
  payload: {
    rootPath: string
  }
  meta: { shell: true }
}
