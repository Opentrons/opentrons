// TODO(mc, 2021-02-17): remove this ambient declarations file for
// @opentrons/app when it is rewritten in TypeScript
/* eslint-disable import/no-duplicates */

declare module '@opentrons/app/src/logger' {
  export type LogLevel =
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly'

  export type Log = (message: string, meta?: Record<string, unknown>) => void

  export type Logger = Record<LogLevel, Log>
}

declare module '@opentrons/app/src/__mocks__/logger' {
  import type { Logger } from '@opentrons/app/src/logger'

  export function createLogger(filename: string): Logger
  export function useLogger(filename: string): Logger
}

declare module '@opentrons/app/src/redux/types' {
  export interface Action {
    type: string
    payload?: unknown | Record<string, unknown>
    meta?: Record<string, unknown>
  }

  export interface Error {
    name?: string
    message?: string
  }
}

declare module '@opentrons/app/src/redux/buildroot/types' {
  import type { Action } from '@opentrons/app/src/redux/types'

  export interface BuildrootUpdateInfo {
    releaseNotes: string
  }

  export type BuildrootAction = Action
}

declare module '@opentrons/app/src/redux/config/types' {
  import type { LogLevel } from '@opentrons/app/src/logger'
  import type { Action } from '@opentrons/app/src/redux/types'

  export interface ConfigValueChangeAction extends Action {
    payload: { path: string; value?: unknown }
  }

  export type UrlProtocol = 'file:' | 'http:'

  export type UpdateChannel = 'latest' | 'beta' | 'alpha'

  export type DiscoveryCandidates = string | string[]

  export type ConfigV0 = Record<string, unknown> & { version: number }

  export type ConfigV1 = Record<string, unknown> & { version: number }

  export type ConfigV2 = Record<string, unknown> & { version: number }

  export type ConfigV3 = Record<string, unknown> & { version: number }

  export type ConfigV4 = Record<string, unknown> & { version: number }

  export interface Config {
    version: number
    devtools: boolean
    reinstallDevtools?: boolean
    buildroot: {
      manifestUrl: string
    }
    log: {
      level: {
        file: LogLevel
        console: LogLevel
      }
    }
    ui: {
      width: number
      height: number
      url: {
        protocol: UrlProtocol
        path: string
      }
      webPreferences: {
        webSecurity: boolean
      }
    }
    discovery: {
      candidates: DiscoveryCandidates
      disableCache: boolean
    }
    labware: {
      directory: string
    }
    alerts: {
      ignored: string[]
    }
    devInternal?: {
      [featureFlag: string]: boolean | undefined
    }
  }
}

declare module '@opentrons/app/src/redux/custom-labware/types' {
  import type { LabwareDefinition2 } from '@opentrons/shared-data'

  interface LabwareFileProps {
    filename: string
    modified: number
  }

  interface ValidatedLabwareProps extends LabwareFileProps {
    definition: LabwareDefinition2
  }

  export interface UncheckedLabwareFile extends LabwareFileProps {
    data: Record<string, unknown> | null
  }

  export interface InvalidLabwareFile extends LabwareFileProps {
    type: 'INVALID_LABWARE_FILE'
  }

  export interface DuplicateLabwareFile extends ValidatedLabwareProps {
    type: 'DUPLICATE_LABWARE_FILE'
  }

  export interface OpentronsLabwareFile extends ValidatedLabwareProps {
    type: 'OPENTRONS_LABWARE_FILE'
  }

  export interface ValidLabwareFile extends ValidatedLabwareProps {
    type: 'VALID_LABWARE_FILE'
  }

  export type CheckedLabwareFile =
    | InvalidLabwareFile
    | DuplicateLabwareFile
    | OpentronsLabwareFile
    | ValidLabwareFile

  export type FailedLabwareFile =
    | InvalidLabwareFile
    | DuplicateLabwareFile
    | OpentronsLabwareFile

  export type CustomLabwareListActionSource =
    | 'poll'
    | 'initial'
    | 'addLabware'
    | 'overwriteLabware'
    | 'changeDirectory'
}

declare module '@opentrons/app/src/redux/robot-api/types' {
  export interface RobotHost {
    name: string
    ip: string
    port: number
  }
}

declare module '@opentrons/app/src/redux/shell/types' {
  export interface UpdateInfo {
    version: string
    files: Array<{ sha512: string; url: string }>
    releaseDate: string
    releaseNotes?: string
  }
}

declare module '@opentrons/app/src/redux/system-info/types' {
  import type { NetworkInterfaceInfo } from 'os'

  export interface UsbDevice {
    locationId: number
    vendorId: number
    productId: number
    deviceName: string
    manufacturer: string
    serialNumber: string
    deviceAddress: number
    windowsDriverVersion?: string | null
  }

  export type NetworkInterface = NetworkInterfaceInfo
}

declare module '@opentrons/app/src/redux/config' {
  import type { Action } from '@opentrons/app/src/redux/types'
  import type {
    Config,
    ConfigValueChangeAction,
  } from '@opentrons/app/src/redux/config/types'

  export const CONFIG_VERSION_LATEST: number
  export const INITIALIZED: 'config:INITIALIZED'
  export const VALUE_UPDATED: 'config:VALUE_UPDATED'
  export const UPDATE_VALUE: 'config:UPDATE_VALUE'
  export const RESET_VALUE: 'config:RESET_VALUE'
  export const TOGGLE_VALUE: 'config:TOGGLE_VALUE'
  export const ADD_UNIQUE_VALUE: 'config:ADD_UNIQUE_VALUE'
  export const SUBTRACT_VALUE: 'config:SUBTRACT_VALUE'

  export function configInitialized(config: Config): Action
  export function configValueUpdated(path: string, value: unknown): Action

  export function updateConfigValue(
    path: string,
    value: unknown
  ): ConfigValueChangeAction

  export function resetConfigValue(path: string): ConfigValueChangeAction
  export function toggleConfigValue(path: string): ConfigValueChangeAction

  export function addUniqueConfigValue(
    path: string,
    value: unknown
  ): ConfigValueChangeAction

  export function subtractConfigValue(
    path: string,
    value: unknown
  ): ConfigValueChangeAction
}

// NOTE(mc, 2021-02-17): intentionally duplicated to avoid correcting a
// too-deep import in app-shell
declare module '@opentrons/app/src/redux/custom-labware/selectors' {
  export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE'
  export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE'
  export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE'
  export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE'
}

declare module '@opentrons/app/src/redux/custom-labware' {
  import type { Action } from '@opentrons/app/src/redux/types'
  import type {
    DuplicateLabwareFile,
    FailedLabwareFile,
    CheckedLabwareFile,
    CustomLabwareListActionSource,
  } from '@opentrons/app/src/redux/custom-labware/types'

  export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE'
  export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE'
  export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE'
  export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE'

  export const POLL: 'poll'
  export const INITIAL: 'initial'
  export const ADD_LABWARE: 'addLabware'
  export const OVERWRITE_LABWARE: 'overwriteLabware'
  export const CHANGE_DIRECTORY: 'changeDirectory'

  export const FETCH_CUSTOM_LABWARE: 'labware:FETCH_CUSTOM_LABWARE'
  export const CHANGE_CUSTOM_LABWARE_DIRECTORY: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY'
  export const ADD_CUSTOM_LABWARE: 'labware:ADD_CUSTOM_LABWARE'
  export const OPEN_CUSTOM_LABWARE_DIRECTORY: 'labware:OPEN_CUSTOM_LABWARE_DIRECTORY'

  export const LABWARE_DIRECTORY_CONFIG_PATH: string

  export function addCustomLabwareFailure(
    labware?: FailedLabwareFile | null,
    message?: string | null
  ): Action

  export function customLabwareList(
    payload: CheckedLabwareFile[],
    source?: CustomLabwareListActionSource
  ): Action

  export function customLabwareListFailure(
    message: string,
    source?: CustomLabwareListActionSource
  ): Action

  export function fetchCustomLabware(): Action
  export function changeCustomLabwareDirectory(): Action
  export function openCustomLabwareDirectory(): Action
  export function addCustomLabware(
    overwrite?: DuplicateLabwareFile | null
  ): Action
}

declare module '@opentrons/app/src/redux/custom-labware/__fixtures__' {
  import type { LabwareDefinition2 } from '@opentrons/shared-data'
  import {
    ValidLabwareFile,
    InvalidLabwareFile,
    OpentronsLabwareFile,
    DuplicateLabwareFile,
  } from '@opentrons/app/src/redux/custom-labware/types'

  export const mockDefinition: LabwareDefinition2
  export const mockValidLabware: ValidLabwareFile
  export const mockInvalidLabware: InvalidLabwareFile
  export const mockOpentronsLabware: OpentronsLabwareFile
  export const mockDuplicateLabware: DuplicateLabwareFile
  export const mockTipRackDefinition: LabwareDefinition2
}

declare module '@opentrons/app/src/redux/robot-api/constants' {
  export const HTTP_API_VERSION: number
}

declare module '@opentrons/app/src/redux/system-info' {
  import type { Action } from '@opentrons/app/src/redux/types'
  import type {
    UsbDevice,
    NetworkInterface,
  } from '@opentrons/app/src/redux/system-info/types'

  export function initialized(
    devices: UsbDevice[],
    interfaces: NetworkInterface[]
  ): Action
  export function usbDeviceAdded(device: UsbDevice): Action
  export function usbDeviceRemoved(device: UsbDevice): Action
  export function networkInterfacesChanged(
    interfaces: NetworkInterface[]
  ): Action
}

declare module '@opentrons/app/src/redux/system-info/__fixtures__' {
  import type {
    UsbDevice,
    NetworkInterface,
  } from '@opentrons/app/src/redux/system-info/types'

  export const mockUsbDevice: UsbDevice
  export const mockRealtekDevice: UsbDevice
  export const mockWindowsRealtekDevice: UsbDevice
  export const mockNetworkInterface: NetworkInterface
  export const mockNetworkInterfaceV6: NetworkInterface
}

declare module '@opentrons/app/src/redux/discovery' {
  import type { Action } from '@opentrons/app/src/redux/types'

  export function startDiscovery(): Action
  export function finishDiscovery(): Action
}

declare module '@opentrons/app/src/redux/discovery/actions' {
  export const DISCOVERY_START: 'discovery:START'
  export const DISCOVERY_FINISH: 'discovery:FINISH'
  export const DISCOVERY_REMOVE: 'discovery:REMOVE'
  export const CLEAR_CACHE: 'discovery:CLEAR_CACHE'
}

declare module '@opentrons/app/src/redux/shell/actions' {
  import type { Action } from '@opentrons/app/src/redux/types'

  export const UI_INITIALIZED: 'shell:UI_INITIALIZED'

  export function uiInitialized(): Action
}
