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
} from '@opentrons/app/src/redux/config/types'

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
    manifestUrl:
      'https://opentrons-buildroot-ci.s3.us-east-2.amazonaws.com/releases.json',
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
    optedIn: false,
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
    discovery: {
      ...prevConfig.discovery,
      hidden: [],
    },
    python: {
      pathToPythonOverride: null,
    },
  }

  return nextConfig
}

const MIGRATIONS: [
  (prevConfig: ConfigV0) => ConfigV1,
  (prevConfig: ConfigV1) => ConfigV2,
  (prevConfig: ConfigV2) => ConfigV3,
  (prevConfig: ConfigV3) => ConfigV4,
  (prevConfig: ConfigV4) => ConfigV5
] = [toVersion1, toVersion2, toVersion3, toVersion4, toVersion5]

export const DEFAULTS: Config = migrate(DEFAULTS_V0)

export function migrate(
  prevConfig: ConfigV0 | ConfigV1 | ConfigV2 | ConfigV3 | ConfigV4 | ConfigV5
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
