import type {
  AppRestartAction,
  CameraPhotoOpenAction,
  CameraStreamOpenAction,
  NotifySubscribeAction,
  NotifyTopic,
  OT2AppOpenAction,
  ReloadUiAction,
  RobotMassStorageDeviceAdded,
  RobotMassStorageDeviceEnumerated,
  RobotMassStorageDeviceRemoved,
  SendLogAction,
  StepDetailViewerCloseAction,
  StepDetailViewerClosedAction,
  StepDetailViewerOpenAction,
  StepDetailViewerUpdateAction,
  UiInitializedAction,
  UpdateBrightnessAction,
  UsbRequestsAction,
} from './types'

export const UI_INITIALIZED: 'shell:UI_INITIALIZED' = 'shell:UI_INITIALIZED'
export const USB_HTTP_REQUESTS_START: 'shell:USB_HTTP_REQUESTS_START' =
  'shell:USB_HTTP_REQUESTS_START'
export const USB_HTTP_REQUESTS_STOP: 'shell:USB_HTTP_REQUESTS_STOP' =
  'shell:USB_HTTP_REQUESTS_STOP'
export const APP_RESTART: 'shell:APP_RESTART' = 'shell:APP_RESTART'
export const RELOAD_UI: 'shell:RELOAD_UI' = 'shell:RELOAD_UI'
export const OT2_APP_OPEN: 'shell:OT2_APP_OPEN' = 'shell:OT2_APP_OPEN'
export const SEND_LOG: 'shell:SEND_LOG' = 'shell:SEND_LOG'
export const UPDATE_BRIGHTNESS: 'shell:UPDATE_BRIGHTNESS' =
  'shell:UPDATE_BRIGHTNESS'
export const ROBOT_MASS_STORAGE_DEVICE_ADDED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ADDED'
export const ROBOT_MASS_STORAGE_DEVICE_REMOVED: 'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_REMOVED'
export const ROBOT_MASS_STORAGE_DEVICE_ENUMERATED: 'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED' =
  'shell:ROBOT_MASS_STORAGE_DEVICE_ENUMERATED'
export const NOTIFY_SUBSCRIBE: 'shell:NOTIFY_SUBSCRIBE' =
  'shell:NOTIFY_SUBSCRIBE'
export const SEND_FILE_PATHS: 'shell:SEND_FILE_PATHS' = 'shell:SEND_FILE_PATHS'
export const CAMERA_STREAM_OPEN = 'shell:CAMERA_STREAM_OPEN' as const
export const CAMERA_PHOTO_OPEN = 'shell:CAMERA_PHOTO_OPEN' as const
export const STEP_DETAIL_VIEWER_OPEN = 'shell:STEP_DETAIL_VIEWER_OPEN' as const
export const STEP_DETAIL_VIEWER_UPDATE =
  'shell:STEP_DETAIL_VIEWER_UPDATE' as const
export const STEP_DETAIL_VIEWER_CLOSE =
  'shell:STEP_DETAIL_VIEWER_CLOSE' as const
export const STEP_DETAIL_VIEWER_CLOSED =
  'shell:STEP_DETAIL_VIEWER_CLOSED' as const

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

export const reloadUi = (message: string): ReloadUiAction => ({
  type: RELOAD_UI,
  payload: {
    message: message,
  },
  meta: { shell: true },
})

export const openOT2App = (
  payload?: OT2AppOpenAction['payload']
): OT2AppOpenAction => ({
  type: OT2_APP_OPEN,
  payload,
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

export const notifySubscribeAction = (
  hostname: string,
  topic: NotifyTopic
): NotifySubscribeAction => ({
  type: NOTIFY_SUBSCRIBE,
  payload: {
    hostname,
    topic,
  },
  meta: { shell: true },
})

export const cameraStreamOpenAction = (
  hostname: string,
  robotName: string,
  windowTitle: string
): CameraStreamOpenAction => ({
  type: CAMERA_STREAM_OPEN,
  payload: { hostname, robotName, windowTitle },
  meta: { shell: true },
})

export const cameraPhotoOpenAction = (
  payload: CameraPhotoOpenAction['payload']
): CameraPhotoOpenAction => ({
  type: CAMERA_PHOTO_OPEN,
  payload,
  meta: { shell: true },
})

export const stepDetailViewerOpenAction = (
  payload: StepDetailViewerOpenAction['payload']
): StepDetailViewerOpenAction => ({
  type: STEP_DETAIL_VIEWER_OPEN,
  payload,
  meta: { shell: true },
})

export const stepDetailViewerUpdateAction = (
  payload: StepDetailViewerUpdateAction['payload']
): StepDetailViewerUpdateAction => ({
  type: STEP_DETAIL_VIEWER_UPDATE,
  payload,
  meta: { shell: true },
})

export const stepDetailViewerCloseAction = (
  payload: StepDetailViewerCloseAction['payload']
): StepDetailViewerCloseAction => ({
  type: STEP_DETAIL_VIEWER_CLOSE,
  payload,
  meta: { shell: true },
})

export const stepDetailViewerClosedAction = (
  protocolKey: string
): StepDetailViewerClosedAction => ({
  type: STEP_DETAIL_VIEWER_CLOSED,
  payload: { protocolKey },
})
