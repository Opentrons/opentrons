import type { LogLevel } from '../../logger'

export type UrlProtocol = 'file:' | 'http:'

export type UpdateChannel = 'latest' | 'beta' | 'alpha'

export type DiscoveryCandidates = string[]

export type DevInternalFlag =
  | 'allPipetteConfig'
  | 'enableBundleUpload'
  | 'enableChangePipetteWizard'
  | 'enableLiquidSetup'
  | 'enableCalibrationWizards'
  | 'enableManualDeckStateModification'

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
    name: string | null
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

export interface ConfigV4 extends Omit<ConfigV3, 'version' | 'labware'> {
  version: 4
  labware: ConfigV3['labware'] & {
    showLabwareOffsetCodeSnippets: boolean
  }
}

export interface ConfigV5 extends Omit<ConfigV4, 'version'> {
  version: 5
  python: {
    pathToPythonOverride: string | null
  }
}

export interface ConfigV6 extends Omit<ConfigV5, 'version'> {
  version: 6
  modules: {
    heaterShaker: { isAttached: boolean }
  }
}

export interface ConfigV7 extends Omit<ConfigV6, 'version'> {
  version: 7
  ui: ConfigV6['ui'] & {
    minWidth: number
  }
}

export interface ConfigV8 extends Omit<ConfigV7, 'version'> {
  version: 8
}

export interface ConfigV9 extends Omit<ConfigV8, 'version'> {
  version: 9
  isOnDevice: boolean
}

export type Config = ConfigV9
