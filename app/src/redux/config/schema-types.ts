import type { LogLevel } from '../../logger'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string | string[]

export type DevInternalFlag =
  | 'allPipetteConfig'
  | 'enableBundleUpload'
  | 'nextGenApp'

export type FeatureFlags = Partial<Record<DevInternalFlag, boolean | undefined>>

export interface ConfigV0 {
  version: 0
  devtools: boolean
  reinstallDevtools: boolean

  // app update config
  update: {
    channel: UpdateChannel
  }

  // robot update config
  buildroot: {
    manifestUrl: string
  }

  // logging config
  log: {
    level: {
      file: LogLevel
      console: LogLevel
    }
  }

  // ui and browser config
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

  analytics: {
    appId: string
    optedIn: boolean
    seenOptIn: boolean
  }

  // deprecated
  p10WarningSeen: {
    [id: string]: boolean | null | undefined
  }

  support: {
    userId: string
    createdAt: number
    name: string
    email: string | null | undefined
  }

  discovery: {
    candidates: DiscoveryCandidates
  }

  // custom labware files
  labware: {
    directory: string
  }

  // app wide alerts
  alerts: { ignored: string[] }

  // internal development flags
  devInternal?: FeatureFlags
}

export interface ConfigV1 extends Omit<ConfigV0, 'version' | 'discovery'> {
  version: 1
  discovery: {
    candidates: DiscoveryCandidates
    disableCache: boolean
  }
}

export interface ConfigV2 extends Omit<ConfigV1, 'version'> {
  version: 2
  calibration: {
    useTrashSurfaceForTipCal: boolean | null
  }
}

// v3 config changes default values but does not change schema
export interface ConfigV3 extends Omit<ConfigV2, 'version' | 'support'> {
  version: 3
  support: ConfigV2['support'] & {
    name: string | null
    email: string | null
  }
}

export type Config = ConfigV3
