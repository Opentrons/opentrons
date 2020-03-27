// @flow
import type { LogLevel } from '../logger'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | Array<string>

export type DevInternalFlag = 'allPipetteConfig' | 'enableBundleUpload'

export type FeatureFlags = $Shape<{|
  [DevInternalFlag]: boolean | void,
|}>

export type Config = {
  devtools: boolean,
  reinstallDevtools: boolean,

  // app update config
  update: {
    channel: UpdateChannel,
  },

  // robot update config
  buildroot: {
    manifestUrl: string,
  },

  // logging config
  log: {
    level: {
      file: LogLevel,
      console: LogLevel,
    },
  },

  // ui and browser config
  ui: {
    width: number,
    height: number,
    url: {
      protocol: UrlProtocol,
      path: string,
    },
    webPreferences: {
      webSecurity: boolean,
    },
  },

  analytics: {
    appId: string,
    optedIn: boolean,
    seenOptIn: boolean,
  },

  // deprecated; remove with first migration
  p10WarningSeen: {
    [id: string]: ?boolean,
  },

  support: {
    userId: string,
    createdAt: number,
    name: string,
    email: ?string,
  },

  discovery: {
    candidates: DiscoveryCandidates,
  },

  // custom labware files
  labware: {
    directory: string,
  },

  // internal development flags
  devInternal?: FeatureFlags,
}

export type UpdateConfigAction = {|
  type: 'config:UPDATE',
  payload: {| path: string, value: any |},
  meta: {| shell: true |},
|}

export type ResetConfigAction = {|
  type: 'config:RESET',
  payload: {| path: string |},
  meta: {| shell: true |},
|}

export type SetConfigAction = {|
  type: 'config:SET',
  payload: {|
    path: string,
    value: any,
  |},
|}

export type ConfigAction =
  | UpdateConfigAction
  | ResetConfigAction
  | SetConfigAction
