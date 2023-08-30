import path from 'path'
import { app } from 'electron'
import uuid from 'uuid/v4'
import { CONFIG_VERSION_LATEST } from '@opentrons/app/src/redux/config'

import type {
  Config,
  ConfigV0,
  ConfigV1,
  ConfigV2,
  ConfigV3,
  ConfigV4,
  ConfigV5,
  ConfigV6,
  ConfigV7,
  ConfigV8,
  ConfigV9,
  ConfigV10,
  ConfigV11,
  ConfigV12,
  ConfigV13,
  ConfigV14,
  ConfigV15,
  ConfigV16,
  ConfigV17,
  ConfigV18,
} from '@opentrons/app/src/redux/config/types'
// format
// base config v0 defaults
// any default values for later config versions are specified in the migration
// functions for those version below

export const DEFAULTS_V0: ConfigV0 = {
  version: 0,
  devtools: false,
  reinstallDevtools: false,

  // app update config
  update: {
    channel: _PKG_VERSION_.includes('beta') ? 'beta' : 'latest',
  },

  buildroot: {
    manifestUrl: 'not-used',
  },

  // logging config
  log: {
    level: {
      file: 'debug',
      console: 'info',
    },
  },

  // ui and browser config
  ui: {
    width: 1024,
    height: 768,
    url: {
      protocol: 'file:',
      path: 'ui/index.html',
    },
    webPreferences: {
      webSecurity: true,
    },
  },

  // analytics (mixpanel)
  analytics: {
    appId: uuid(),
    optedIn: true,
    seenOptIn: false,
  },

  // user support (intercom)
  support: {
    userId: uuid(),
    createdAt: Math.floor(Date.now() / 1000),
    name: 'Unknown User',
    email: null,
  },

  // robot discovery
  discovery: {
    candidates: [],
  },

  // custom labware files
  labware: {
    directory: path.join(app.getPath('userData'), 'labware'),
  },

  alerts: {
    ignored: [],
  },

  // deprecated fields maintained for safety
  p10WarningSeen: {},
}

// config version 1 migration and defaults
const toVersion1 = (prevConfig: ConfigV0): ConfigV1 => {
  const nextConfig = {
    ...prevConfig,
    version: 1 as const,
    discovery: {
      ...prevConfig.discovery,
      disableCache: false,
    },
  }

  return nextConfig
}

// config version 2 migration and defaults
const toVersion2 = (prevConfig: ConfigV1): ConfigV2 => {
  const nextConfig = {
    ...prevConfig,
    version: 2 as const,
    calibration: {
      useTrashSurfaceForTipCal: null,
    },
  }

  return nextConfig
}

// config version 3 migration and defaults
const toVersion3 = (prevConfig: ConfigV2): ConfigV3 => {
  const nextConfig = {
    ...prevConfig,
    version: 3 as const,
    support: {
      ...prevConfig.support,
      // name and email were never changed by the app, and its default values
      // were causing problems. Null them out for future implementations
      name: null,
      email: null,
    },
  }

  return nextConfig
}

// config version 4 migration and defaults
const toVersion4 = (prevConfig: ConfigV3): ConfigV4 => {
  const nextConfig = {
    ...prevConfig,
    version: 4 as const,
    labware: {
      ...prevConfig.labware,
      showLabwareOffsetCodeSnippets: false,
    },
  }

  return nextConfig
}

// config version 5 migration and defaults
const toVersion5 = (prevConfig: ConfigV4): ConfigV5 => {
  const nextConfig = {
    ...prevConfig,
    version: 5 as const,
    python: {
      pathToPythonOverride: null,
    },
  }

  return nextConfig
}

// config version 6 migration and defaults
const toVersion6 = (prevConfig: ConfigV5): ConfigV6 => {
  const nextConfig = {
    ...prevConfig,
    version: 6 as const,
    modules: {
      heaterShaker: { isAttached: false },
    },
  }

  return nextConfig
}

// config version 7 migration and defaults
const toVersion7 = (prevConfig: ConfigV6): ConfigV7 => {
  const nextConfig = {
    ...prevConfig,
    version: 7 as const,
    ui: {
      ...prevConfig.ui,
      width: 800,
      minWidth: 600,
      height: 760,
    },
  }

  return nextConfig
}

// config version 8 migration and defaults
const toVersion8 = (prevConfig: ConfigV7): ConfigV8 => {
  const nextConfig = {
    ...prevConfig,
    version: 8 as const,
    ui: {
      ...prevConfig.ui,
      width: 1024,
      height: 768,
    },
  }

  return nextConfig
}

// config version 9 migration and defaults
const toVersion9 = (prevConfig: ConfigV8): ConfigV9 => {
  const nextConfig = {
    ...prevConfig,
    version: 9 as const,
    isOnDevice: false,
  }

  return nextConfig
}

// config version 10 migration and defaults
const toVersion10 = (prevConfig: ConfigV9): ConfigV10 => {
  const nextConfig = {
    ...prevConfig,
    version: 10 as const,
    protocols: { sendAllProtocolsToOT3: false },
  }

  return nextConfig
}

// config version 11 migration and defaults
const toVersion11 = (prevConfig: ConfigV10): ConfigV11 => {
  const nextConfig = {
    ...prevConfig,
    version: 11 as const,
    protocols: {
      ...prevConfig.protocols,
      protocolsStoredSortKey: null,
    },
  }

  return nextConfig
}

// config version 12 migration and defaults
const toVersion12 = (prevConfig: ConfigV11): ConfigV12 => {
  const { buildroot, version, ...prevConfigFields } = prevConfig
  const nextConfig = {
    ...prevConfigFields,
    version: 12 as const,
    robotSystemUpdate: {
      manifestUrls: {
        OT2: 'not-used',
        OT3: 'not-used',
      },
    },
  }

  return nextConfig
}

// config version 13 migration and defaults
const toVersion13 = (prevConfig: ConfigV12): ConfigV13 => {
  const nextConfig = {
    ...prevConfig,
    version: 13 as const,
    protocols: {
      ...prevConfig.protocols,
      protocolsOnDeviceSortKey: null,
    },
  }
  return nextConfig
}

// config version 14 migration and defaults
const toVersion14 = (prevConfig: ConfigV13): ConfigV14 => {
  const nextConfig = {
    ...prevConfig,
    version: 14 as const,
    protocols: {
      ...prevConfig.protocols,
      pinnedProtocolIds: [],
    },
  }
  return nextConfig
}

// config version 15 migration and defaults
const toVersion15 = (prevConfig: ConfigV14): ConfigV15 => {
  // Note (kj:02/10/2023) default settings
  // sleepMs: never(24h x 7 days), brightness device default settings, textSize x1
  const nextConfig = {
    ...prevConfig,
    version: 15 as const,
    onDeviceDisplaySettings: {
      sleepMs: 60 * 1000 * 60 * 24 * 7,
      brightness: 4,
      textSize: 1,
    },
  }
  return nextConfig
}

// config version 16 migration and defaults
const toVersion16 = (prevConfig: ConfigV15): ConfigV16 => {
  const nextConfig = {
    ...prevConfig,
    version: 16 as const,
    onDeviceDisplaySettings: {
      ...prevConfig.onDeviceDisplaySettings,
      unfinishedUnboxingFlowRoute: null,
    },
  }
  return nextConfig
}

// config version 17 migration and defaults
const toVersion17 = (prevConfig: ConfigV16): ConfigV17 => {
  const nextConfig = {
    ...prevConfig,
    version: 17 as const,
    protocols: {
      ...prevConfig.protocols,
      applyHistoricOffsets: true,
    },
  }
  return nextConfig
}

// config version 18 migration and defaults
const toVersion18 = (prevConfig: ConfigV17): ConfigV18 => {
  const { robotSystemUpdate, version, ...prevConfigFields } = prevConfig
  return { ...prevConfigFields, version: 18 as const }
}

const MIGRATIONS: [
  (prevConfig: ConfigV0) => ConfigV1,
  (prevConfig: ConfigV1) => ConfigV2,
  (prevConfig: ConfigV2) => ConfigV3,
  (prevConfig: ConfigV3) => ConfigV4,
  (prevConfig: ConfigV4) => ConfigV5,
  (prevConfig: ConfigV5) => ConfigV6,
  (prevConfig: ConfigV6) => ConfigV7,
  (prevConfig: ConfigV7) => ConfigV8,
  (prevConfig: ConfigV8) => ConfigV9,
  (prevConfig: ConfigV9) => ConfigV10,
  (prevConfig: ConfigV10) => ConfigV11,
  (prevConfig: ConfigV11) => ConfigV12,
  (prevConfig: ConfigV12) => ConfigV13,
  (prevConfig: ConfigV13) => ConfigV14,
  (prevConfig: ConfigV14) => ConfigV15,
  (prevConfig: ConfigV15) => ConfigV16,
  (prevConfig: ConfigV16) => ConfigV17,
  (prevConfig: ConfigV17) => ConfigV18
] = [
  toVersion1,
  toVersion2,
  toVersion3,
  toVersion4,
  toVersion5,
  toVersion6,
  toVersion7,
  toVersion8,
  toVersion9,
  toVersion10,
  toVersion11,
  toVersion12,
  toVersion13,
  toVersion14,
  toVersion15,
  toVersion16,
  toVersion17,
  toVersion18,
]

export const DEFAULTS: Config = migrate(DEFAULTS_V0)

export function migrate(
  prevConfig:
    | ConfigV0
    | ConfigV1
    | ConfigV2
    | ConfigV3
    | ConfigV4
    | ConfigV5
    | ConfigV6
    | ConfigV7
    | ConfigV8
    | ConfigV9
    | ConfigV10
    | ConfigV11
    | ConfigV12
    | ConfigV13
    | ConfigV14
    | ConfigV15
    | ConfigV16
    | ConfigV17
    | ConfigV18
): Config {
  const prevVersion = prevConfig.version
  let result = prevConfig

  // loop through the migrations, skipping any migrations that are unnecessary
  for (let i: number = prevVersion; i < MIGRATIONS.length; i++) {
    const migrateVersion = MIGRATIONS[i]
    // @ts-expect-error (sh: 01-24-2021): migrateVersion function input typed to never
    result = migrateVersion(result)
  }

  if (result.version < CONFIG_VERSION_LATEST) {
    throw new Error(
      `Config migration failed; expected at least version ${CONFIG_VERSION_LATEST} but got ${result.version}`
    )
  }

  return result as Config
}
