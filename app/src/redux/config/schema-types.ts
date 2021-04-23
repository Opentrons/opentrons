import type { LogLevel } from '../../logger'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | string[]

export type DevInternalFlag =
  | 'allPipetteConfig'
  | 'enableBundleUpload'
  | 'moduleAugmentation'

export type FeatureFlags = Partial<Record<DevInternalFlag, boolean | undefined>>

export type ConfigV0 = Readonly<{
  version: 0
  devtools: boolean
  reinstallDevtools: boolean

  // app update config
  update: Readonly<{
    channel: UpdateChannel
  }>

  // robot update config
  buildroot: Readonly<{
    manifestUrl: string
  }>

  // logging config
  log: Readonly<{
    level: Readonly<{
      file: LogLevel
      console: LogLevel
    }>
  }>

  // ui and browser config
  ui: Readonly<{
    width: number
    height: number
    url: Readonly<{
      protocol: UrlProtocol
      path: string
    }>
    webPreferences: Readonly<{
      webSecurity: boolean
    }>
  }>

  analytics: Readonly<{
    appId: string
    optedIn: boolean
    seenOptIn: boolean
  }>

  // deprecated
  p10WarningSeen: Readonly<{
    [id: string]: boolean | null | undefined
  }>

  support: Readonly<{
    userId: string
    createdAt: number
    name: string
    email: string | null | undefined
  }>

  discovery: Readonly<{
    candidates: DiscoveryCandidates
  }>

  // custom labware files
  labware: Readonly<{
    directory: string
  }>

  // app wide alerts
  alerts: Readonly<{ ignored: string[] }>

  // internal development flags
  devInternal?: Readonly<FeatureFlags>
}>

export type ConfigV1 = Readonly<
  ConfigV0 & {
    version: 1
    discovery: Readonly<{
      candidates: DiscoveryCandidates
      disableCache: boolean
    }>
  }
>

export type ConfigV2 = Readonly<
  ConfigV1 & {
    version: 2
    calibration: Readonly<{
      useTrashSurfaceForTipCal: boolean | null
    }>
  }
>

// v3 config changes default values but does not change schema
export type ConfigV3 = Readonly<
  ConfigV2 & {
    version: 3
    support: Readonly<
      Pick<ConfigV2, 'support'> & {
        name: string | null
        email: string | null
      }
    >
  }
>

export type Config = ConfigV3
