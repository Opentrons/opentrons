import type {
  AddCustomLabwareAction,
  AddCustomLabwareFailureAction,
  AddCustomLabwareFileAction,
  AddNewLabwareNameAction,
  ChangeCustomLabwareDirectoryAction,
  CheckedLabwareFile,
  ClearAddCustomLabwareFailureAction,
  ClearNewLabwareNameAction,
  CustomLabwareListAction,
  CustomLabwareListActionSource,
  CustomLabwareListFailureAction,
  DeleteCustomLabwareFileAction,
  DuplicateLabwareFile,
  FailedLabwareFile,
  OpenCustomLabwareDirectoryAction,
} from '@opentrons/app/src/redux/custom-labware/types'
import type {
  ResetConfigValueAction,
  UpdateConfigValueAction,
} from '@opentrons/app/src/redux/config'
import type {
  AddProtocolAction,
  AddProtocolFailureAction,
  AnalyzeProtocolAction,
  AnalyzeProtocolFailureAction,
  AnalyzeProtocolSuccessAction,
  ClearAddProtocolFailureAction,
  FetchProtocolsAction,
  OpenProtocolDirectoryAction,
  ProtocolListActionSource,
  RemoveProtocolAction,
  StoredProtocolData,
  StoredProtocolDir,
  UpdateProtocolListAction,
  UpdateProtocolListFailureAction,
  ViewProtocolSourceFolder,
} from '@opentrons/app/src/redux/protocol-storage'
import {
  ADD_CUSTOM_LABWARE,
  ADD_CUSTOM_LABWARE_FAILURE,
  ADD_CUSTOM_LABWARE_FILE,
  ADD_NEW_LABWARE_NAME,
  ADD_PROTOCOL,
  ADD_PROTOCOL_FAILURE,
  ANALYZE_PROTOCOL,
  ANALYZE_PROTOCOL_FAILURE,
  ANALYZE_PROTOCOL_SUCCESS,
  APP_RESTART,
  CHANGE_CUSTOM_LABWARE_DIRECTORY,
  CLEAR_ADD_CUSTOM_LABWARE_FAILURE,
  CLEAR_ADD_PROTOCOL_FAILURE,
  CLEAR_NEW_LABWARE_NAME,
  CONFIG_INITIALIZED,
  CUSTOM_LABWARE_LIST,
  CUSTOM_LABWARE_LIST_FAILURE,
  DELETE_CUSTOM_LABWARE_FILE,
  FETCH_PROTOCOLS,
  LABWARE_DIRECTORY_CONFIG_PATH,
  NETWORK_INTERFACES_CHANGED,
  OPEN_CUSTOM_LABWARE_DIRECTORY,
  OPEN_PROTOCOL_DIRECTORY,
  POLL,
  RELOAD_UI,
  REMOVE_PROTOCOL,
  RESET_VALUE,
  SEND_LOG,
  SYSTEM_INFO_INITIALIZED,
  UPDATE_PROTOCOL_LIST,
  UPDATE_PROTOCOL_LIST_FAILURE,
  UPDATE_VALUE,
  USB_DEVICE_ADDED,
  USB_DEVICE_REMOVED,
  USB_HTTP_REQUESTS_START,
  USB_HTTP_REQUESTS_STOP,
  VALUE_UPDATED,
  VIEW_PROTOCOL_SOURCE_FOLDER,
  NOTIFY_SUBSCRIBE,
  ROBOT_MASS_STORAGE_DEVICE_ADDED,
  ROBOT_MASS_STORAGE_DEVICE_ENUMERATED,
  ROBOT_MASS_STORAGE_DEVICE_REMOVED,
  UPDATE_BRIGHTNESS,
  DISCOVERY_START,
  DISCOVERY_FINISH,
  SEND_READY_STATUS,
  SEND_FILE_PATHS,
} from './constants'
import type {
  InitializedAction,
  NetworkInterface,
  NetworkInterfacesChangedAction,
  UsbDevice,
  UsbDeviceAddedAction,
  UsbDeviceRemovedAction,
} from '@opentrons/app/src/redux/system-info/types'
import type {
  ConfigInitializedAction,
  ConfigValueUpdatedAction,
  Config,
  StartDiscoveryAction,
  FinishDiscoveryAction,
  RobotSystemAction,
  SendFilePathsAction,
} from './types'
import type {
  AppRestartAction,
  NotifySubscribeAction,
  NotifyTopic,
  ReloadUiAction,
  RobotMassStorageDeviceAdded,
  RobotMassStorageDeviceEnumerated,
  RobotMassStorageDeviceRemoved,
  SendLogAction,
  UpdateBrightnessAction,
  UsbRequestsAction,
} from '@opentrons/app/src/redux/shell/types'

// config file has been initialized
export const configInitialized = (config: Config): ConfigInitializedAction => ({
  type: CONFIG_INITIALIZED,
  payload: { config },
  meta: { shell: true },
})

// config value has been updated
export const configValueUpdated = (
  path: string,
  value: unknown
): ConfigValueUpdatedAction => ({
  type: VALUE_UPDATED,
  payload: { path, value },
  meta: { shell: true },
})

export const customLabwareList = (
  payload: CheckedLabwareFile[],
  source: CustomLabwareListActionSource = POLL
): CustomLabwareListAction => ({
  type: CUSTOM_LABWARE_LIST,
  payload,
  meta: { source },
})

export const customLabwareListFailure = (
  message: string,
  source: CustomLabwareListActionSource = POLL
): CustomLabwareListFailureAction => ({
  type: CUSTOM_LABWARE_LIST_FAILURE,
  payload: { message },
  meta: { source },
})

export const changeCustomLabwareDirectory = (): ChangeCustomLabwareDirectoryAction => ({
  type: CHANGE_CUSTOM_LABWARE_DIRECTORY,
  meta: { shell: true },
})

export const addCustomLabware = (
  overwrite: DuplicateLabwareFile | null = null
): AddCustomLabwareAction => ({
  type: ADD_CUSTOM_LABWARE,
  payload: { overwrite },
  meta: { shell: true },
})

export const addCustomLabwareFile = (
  filePath: string
): AddCustomLabwareFileAction => ({
  type: ADD_CUSTOM_LABWARE_FILE,
  payload: { filePath },
  meta: { shell: true },
})

export const deleteCustomLabwareFile = (
  filePath: string
): DeleteCustomLabwareFileAction => ({
  type: DELETE_CUSTOM_LABWARE_FILE,
  payload: { filePath },
  meta: { shell: true },
})

export const addCustomLabwareFailure = (
  labware: FailedLabwareFile | null = null,
  message: string | null = null
): AddCustomLabwareFailureAction => ({
  type: ADD_CUSTOM_LABWARE_FAILURE,
  payload: { labware, message },
})

export const clearAddCustomLabwareFailure = (): ClearAddCustomLabwareFailureAction => ({
  type: CLEAR_ADD_CUSTOM_LABWARE_FAILURE,
})

export const addNewLabwareName = (
  filename: string
): AddNewLabwareNameAction => ({
  type: ADD_NEW_LABWARE_NAME,
  payload: { filename },
})

export const clearNewLabwareName = (): ClearNewLabwareNameAction => ({
  type: CLEAR_NEW_LABWARE_NAME,
})

export const openCustomLabwareDirectory = (): OpenCustomLabwareDirectoryAction => ({
  type: OPEN_CUSTOM_LABWARE_DIRECTORY,
  meta: { shell: true },
})

// request a config value reset to default
export const resetConfigValue = (path: string): ResetConfigValueAction => ({
  type: RESET_VALUE,
  payload: { path },
  meta: { shell: true },
})

export const resetCustomLabwareDirectory = (): ResetConfigValueAction => {
  return resetConfigValue(LABWARE_DIRECTORY_CONFIG_PATH)
}

// request a config value update
export const updateConfigValue = (
  path: string,
  value: unknown
): UpdateConfigValueAction => ({
  type: UPDATE_VALUE,
  payload: { path, value },
  meta: { shell: true },
})

// action creators

export const fetchProtocols = (): FetchProtocolsAction => ({
  type: FETCH_PROTOCOLS,
  meta: { shell: true },
})

export const updateProtocolList = (
  payload: StoredProtocolData[],
  source: ProtocolListActionSource = POLL
): UpdateProtocolListAction => ({
  type: UPDATE_PROTOCOL_LIST,
  payload,
  meta: { source },
})

export const updateProtocolListFailure = (
  message: string,
  source: ProtocolListActionSource = POLL
): UpdateProtocolListFailureAction => ({
  type: UPDATE_PROTOCOL_LIST_FAILURE,
  payload: { message },
  meta: { source },
})

export const addProtocol = (protocolFilePath: string): AddProtocolAction => ({
  type: ADD_PROTOCOL,
  payload: { protocolFilePath },
  meta: { shell: true },
})

export const removeProtocol = (protocolKey: string): RemoveProtocolAction => ({
  type: REMOVE_PROTOCOL,
  payload: { protocolKey },
  meta: { shell: true },
})

export const addProtocolFailure = (
  protocol: StoredProtocolDir | null = null,
  message: string | null = null
): AddProtocolFailureAction => ({
  type: ADD_PROTOCOL_FAILURE,
  payload: { protocol, message },
})

export const clearAddProtocolFailure = (): ClearAddProtocolFailureAction => ({
  type: CLEAR_ADD_PROTOCOL_FAILURE,
})

export const openProtocolDirectory = (): OpenProtocolDirectoryAction => ({
  type: OPEN_PROTOCOL_DIRECTORY,
  meta: { shell: true },
})

export const analyzeProtocol = (
  protocolKey: string
): AnalyzeProtocolAction => ({
  type: ANALYZE_PROTOCOL,
  payload: { protocolKey },
  meta: { shell: true },
})

export const analyzeProtocolSuccess = (
  protocolKey: string
): AnalyzeProtocolSuccessAction => ({
  type: ANALYZE_PROTOCOL_SUCCESS,
  payload: { protocolKey },
  meta: { shell: true },
})

export const analyzeProtocolFailure = (
  protocolKey: string
): AnalyzeProtocolFailureAction => ({
  type: ANALYZE_PROTOCOL_FAILURE,
  payload: { protocolKey },
  meta: { shell: true },
})

export const viewProtocolSourceFolder = (
  protocolKey: string
): ViewProtocolSourceFolder => ({
  type: VIEW_PROTOCOL_SOURCE_FOLDER,
  payload: { protocolKey },
  meta: { shell: true },
})

export const initialized = (
  usbDevices: UsbDevice[],
  networkInterfaces: NetworkInterface[]
): InitializedAction => ({
  type: SYSTEM_INFO_INITIALIZED,
  payload: { usbDevices, networkInterfaces },
  meta: { shell: true },
})

export const usbDeviceAdded = (usbDevice: UsbDevice): UsbDeviceAddedAction => ({
  type: USB_DEVICE_ADDED,
  payload: { usbDevice },
  meta: { shell: true },
})

export const usbDeviceRemoved = (
  usbDevice: UsbDevice
): UsbDeviceRemovedAction => ({
  type: USB_DEVICE_REMOVED,
  payload: { usbDevice },
  meta: { shell: true },
})

export const networkInterfacesChanged = (
  networkInterfaces: NetworkInterface[]
): NetworkInterfacesChangedAction => ({
  type: NETWORK_INTERFACES_CHANGED,
  payload: { networkInterfaces },
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

export function startDiscovery(
  timeout: number | null = null
): StartDiscoveryAction {
  return {
    type: DISCOVERY_START,
    payload: { timeout },
    meta: { shell: true },
  }
}

export function finishDiscovery(): FinishDiscoveryAction {
  return { type: DISCOVERY_FINISH, meta: { shell: true } }
}

export const sendReadyStatus = (status: boolean): RobotSystemAction => ({
  type: SEND_READY_STATUS,
  payload: { shellReady: status },
  meta: { shell: true },
})

export const sendFilePaths = (filePaths: string[]): SendFilePathsAction => ({
  type: SEND_FILE_PATHS,
  payload: { filePaths },
  meta: { shell: true },
})
