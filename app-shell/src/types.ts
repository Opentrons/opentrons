// TODO(mc, 2018-08-08): figure out type exports from app
import type {
  Action,
  Error as PlainError,
} from '@opentrons/app/src/redux/types'

import type { Config } from './config'
import type { Logger } from '@opentrons/app/src/logger'
export type { Action, PlainError }

export type Dispatch = (action: Action) => void

export type { Logger }

// copied types below from the app so the app shell does not pull in the app
// in its bundle

export type UI_INITIALIZED_TYPE = 'shell:UI_INITIALIZED'
export type CONFIG_INITIALIZED_TYPE = 'config:INITIALIZED'
export type CONFIG_UPDATE_VALUE_TYPE = 'config:UPDATE_VALUE'
export type CONFIG_RESET_VALUE_TYPE = 'config:RESET_VALUE'
export type CONFIG_TOGGLE_VALUE_TYPE = 'config:TOGGLE_VALUE'
export type CONFIG_ADD_UNIQUE_VALUE_TYPE = 'config:ADD_UNIQUE_VALUE'
export type CONFIG_SUBTRACT_VALUE_TYPE = 'config:SUBTRACT_VALUE'
export type CONFIG_VALUE_UPDATED_TYPE = 'config:VALUE_UPDATED'

export type POLL_TYPE = 'poll'
export type INITIAL_TYPE = 'initial'
export type ADD_LABWARE_TYPE = 'addLabware'
export type DELETE_LABWARE_TYPE = 'deleteLabware'
export type OVERWRITE_LABWARE_TYPE = 'overwriteLabware'
export type CHANGE_DIRECTORY_TYPE = 'changeDirectory'

export type FETCH_CUSTOM_LABWARE_TYPE = 'labware:FETCH_CUSTOM_LABWARE'
export type CUSTOM_LABWARE_LIST_TYPE = 'labware:CUSTOM_LABWARE_LIST'
export type CUSTOM_LABWARE_LIST_FAILURE_TYPE = 'labware:CUSTOM_LABWARE_LIST_FAILURE'
export type CHANGE_CUSTOM_LABWARE_DIRECTORY_TYPE = 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY'
export type ADD_CUSTOM_LABWARE_TYPE = 'labware:ADD_CUSTOM_LABWARE'
export type ADD_CUSTOM_LABWARE_FILE_TYPE = 'labware:ADD_CUSTOM_LABWARE_FILE'
export type ADD_CUSTOM_LABWARE_FAILURE_TYPE = 'labware:ADD_CUSTOM_LABWARE_FAILURE'
export type ADD_CUSTOM_LABWARE_FILE_FROM_CREATOR_TYPE = 'labware:ADD_CUSTOM_LABWARE_FILE_BLOB'
export type CLEAR_ADD_CUSTOM_LABWARE_FAILURE_TYPE = 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE'
export type ADD_NEW_LABWARE_NAME_TYPE = 'labware:ADD_NEW_LABWARE_NAME'
export type CLEAR_NEW_LABWARE_NAME_TYPE = 'labware:CLEAR_NEW_LABWARE_NAME'
export type OPEN_CUSTOM_LABWARE_DIRECTORY_TYPE = 'labware:OPEN_CUSTOM_LABWARE_DIRECTORY'
export type DELETE_CUSTOM_LABWARE_FILE_TYPE = 'labware:DELETE_CUSTOM_LABWARE_FILE'
export type INVALID_LABWARE_FILE_TYPE = 'INVALID_LABWARE_FILE'
export type DUPLICATE_LABWARE_FILE_TYPE = 'DUPLICATE_LABWARE_FILE'
export type OPENTRONS_LABWARE_FILE_TYPE = 'OPENTRONS_LABWARE_FILE'
export type VALID_LABWARE_FILE_TYPE = 'VALID_LABWARE_FILE'
export type OPEN_PYTHON_DIRECTORY_TYPE = 'protocol-analysis:OPEN_PYTHON_DIRECTORY'
export type CHANGE_PYTHON_PATH_OVERRIDE_TYPE = 'protocol-analysis:CHANGE_PYTHON_PATH_OVERRIDE'

export type FETCH_PROTOCOLS_TYPE = 'protocolStorage:FETCH_PROTOCOLS'
export type UPDATE_PROTOCOL_LIST_TYPE = 'protocolStorage:UPDATE_PROTOCOL_LIST'
export type UPDATE_PROTOCOL_LIST_FAILURE_TYPE = 'protocolStorage:UPDATE_PROTOCOL_LIST_FAILURE'
export type ADD_PROTOCOL_TYPE = 'protocolStorage:ADD_PROTOCOL'
export type REMOVE_PROTOCOL_TYPE = 'protocolStorage:REMOVE_PROTOCOL'
export type ADD_PROTOCOL_FAILURE_TYPE = 'protocolStorage:ADD_PROTOCOL_FAILURE'
export type CLEAR_ADD_PROTOCOL_FAILURE_TYPE = 'protocolStorage:CLEAR_ADD_PROTOCOL_FAILURE'
export type OPEN_PROTOCOL_DIRECTORY_TYPE = 'protocolStorage:OPEN_PROTOCOL_DIRECTORY'
export type ANALYZE_PROTOCOL_TYPE = 'protocolStorage:ANALYZE_PROTOCOL'
export type ANALYZE_PROTOCOL_SUCCESS_TYPE = 'protocolStorage:ANALYZE_PROTOCOL_SUCCESS'
export type ANALYZE_PROTOCOL_FAILURE_TYPE = 'protocolStorage:ANALYZE_PROTOCOL_FAILURE'
export type VIEW_PROTOCOL_SOURCE_FOLDER_TYPE = 'protocolStorage:VIEW_PROTOCOL_SOURCE_FOLDER'

export type PROTOCOL_ADDITION_TYPE = 'protocolAddition'

export type OPENTRONS_USB_TYPE = 'opentrons-usb'

export type SYSTEM_INFO_INITIALIZED_TYPE = 'systemInfo:INITIALIZED'

export type USB_DEVICE_ADDED_TYPE = 'systemInfo:USB_DEVICE_ADDED'

export type USB_DEVICE_REMOVED_TYPE = 'systemInfo:USB_DEVICE_REMOVED'

export type NETWORK_INTERFACES_CHANGED_TYPE = 'systemInfo:NETWORK_INTERFACES_CHANGED'
export type USB_HTTP_REQUESTS_START_TYPE = 'shell:USB_HTTP_REQUESTS_START'
export type USB_HTTP_REQUESTS_STOP_TYPE = 'shell:USB_HTTP_REQUESTS_STOP'
export type APP_RESTART_TYPE = 'shell:APP_RESTART'
export type RELOAD_UI_TYPE = 'shell:RELOAD_UI'
export type SEND_LOG_TYPE = 'shell:SEND_LOG'

// copy
// TODO(mc, 2020-05-11): i18n
export type U2E_DRIVER_OUTDATED_MESSAGE_TYPE = 'There is an updated Realtek USB-to-Ethernet adapter driver available for your computer.'
export type U2E_DRIVER_DESCRIPTION_TYPE = 'The OT-2 uses this adapter for its USB connection to the Opentrons App.'
export type U2E_DRIVER_OUTDATED_CTA_TYPE = "Please update your computer's driver to ensure a reliable connection to your OT-2."

export type DISCOVERY_START_TYPE = 'discovery:START'
export type DISCOVERY_FINISH_TYPE = 'discovery:FINISH'
export type DISCOVERY_UPDATE_LIST_TYPE = 'discovery:UPDATE_LIST'
export type DISCOVERY_REMOVE_TYPE = 'discovery:REMOVE'
export type CLEAR_CACHE_TYPE = 'discovery:CLEAR_CACHE'

export interface ConfigInitializedAction {
  type: CONFIG_INITIALIZED_TYPE
  payload: { config: Config }
  meta: { shell: true }
}

export interface ConfigValueUpdatedAction {
  type: CONFIG_VALUE_UPDATED_TYPE
  payload: { path: string; value: any }
  meta: { shell: true }
}
