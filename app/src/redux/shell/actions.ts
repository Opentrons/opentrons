import type {
  UiInitializedAction,
  UsbRequestsAction,
  AppRestartAction,
  SendLogAction,
  UpdateBrightnessAction,
  RobotMassStorageDeviceAdded,
  RobotMassStorageDeviceEnumerated,
  RobotMassStorageDeviceRemoved,
} from './types'

export const UI_INITIALIZED: 'shell:UI_INITIALIZED' = 'shell:UI_INITIALIZED'
export const USB_HTTP_REQUESTS_START: 'shell:USB_HTTP_REQUESTS_START' =
  'shell:USB_HTTP_REQUESTS_START'
export const USB_HTTP_REQUESTS_STOP: 'shell:USB_HTTP_REQUESTS_STOP' =
  'shell:USB_HTTP_REQUESTS_STOP'
export const APP_RESTART: 'shell:APP_RESTART' = 'shell:APP_RESTART'
export const SEND_LOG: 'shell:SEND_LOG' = 'shell:SEND_LOG'
export const UPDATE_BRIGHTNESS: 'shell:UPDATE_BRIGHTNESS' =
  'shell:UPDATE_BRIGHTNESS'
export const ROBOT_MASS_STORAGE_DEVICE_ADDED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED'
export const ROBOT_MASS_STORAGE_DEVICE_REMOVED: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED'
export const ROBOT_MASS_STORAGE_DEVICE_ENUMERATED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED'

export const uiInitialized = (): UiInitializedAction => ({
  type: UI_INITIALIZED,
  meta: { shell: true },
})

export const usbRequestsStart = (): UsbRequestsAction => ({
  type: USB_HTTP_REQUESTS_START,
  meta: { shell: true },
})

export const usbRequestsStop = (): UsbRequestsAction => ({
  type: USB_HTTP_REQUESTS_STOP,
  meta: { shell: true },
})

export const appRestart = (message: string): AppRestartAction => ({
  type: APP_RESTART,
  payload: {
    message: message,
  },
  meta: { shell: true },
})

export const sendLog = (message: string): SendLogAction => ({
  type: SEND_LOG,
  payload: {
    message: message,
  },
  meta: { shell: true },
})

export const updateBrightness = (message: string): UpdateBrightnessAction => ({
  type: UPDATE_BRIGHTNESS,
  payload: {
    message: message,
  },
  meta: { shell: true },
})

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
