// @flow
import type { LogLevel } from '../logger'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | Array<string>

export type DevInternalFlag =
  | 'allPipetteConfig'
  | 'enableBundleUpload'
  | 'enableRobotCalCheck'

export type FeatureFlags = $Shape<{|
  [DevInternalFlag]: boolean | void,
|}>

export type Config = $ReadOnly<{|
  devtools: boolean,
  reinstallDevtools: boolean,

  // app update config
  update: $ReadOnly<{|
    channel: UpdateChannel,
  |}>,

  // robot update config
  buildroot: $ReadOnly<{|
    manifestUrl: string,
  |}>,

  // logging config
  log: $ReadOnly<{|
    level: $ReadOnly<{|
      file: LogLevel,
      console: LogLevel,
    |}>,
  |}>,

  // ui and browser config
  ui: $ReadOnly<{|
    width: number,
    height: number,
    url: $ReadOnly<{|
      protocol: UrlProtocol,
      path: string,
    |}>,
    webPreferences: $ReadOnly<{|
      webSecurity: boolean,
    |}>,
  |}>,

  analytics: $ReadOnly<{|
    appId: string,
    optedIn: boolean,
    seenOptIn: boolean,
  |}>,

  // deprecated; remove with first migration
  p10WarningSeen: $ReadOnly<{|
    [id: string]: ?boolean,
  |}>,

  support: $ReadOnly<{|
    userId: string,
    createdAt: number,
    name: string,
    email: ?string,
  |}>,

  discovery: $ReadOnly<{|
    candidates: DiscoveryCandidates,
  |}>,

  // custom labware files
  labware: $ReadOnly<{|
    directory: string,
  |}>,

  // app wide alerts
  alerts: $ReadOnly<{| ignored: $ReadOnlyArray<string> |}>,

  // internal development flags
  devInternal?: $ReadOnly<FeatureFlags>,
|}>

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
