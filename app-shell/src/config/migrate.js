// @flow
import { CONFIG_VERSION_LATEST } from '@opentrons/app/src/config'
import type {
  Config,
  ConfigV0,
  ConfigV1,
} from '@opentrons/app/src/config/types'
import { app } from 'electron'
import path from 'path'
import uuid from 'uuid/v4'

import pkg from '../../package.json'

// base config v0 defaults
// any default values for later config versions are specified in the migration
// functions for those version below
export const DEFAULTS_V0: ConfigV0 = {
  version: 0,
  devtools: false,
  reinstallDevtools: false,

  // app update config
  update: {
    channel: pkg.version.includes('beta') ? 'beta' : 'latest',
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
    version: 1,
    discovery: {
      ...prevConfig.discovery,
      disableCache: false,
    },
  }

  return nextConfig
}

const MIGRATIONS: [(ConfigV0) => ConfigV1] = [toVersion1]

export const DEFAULTS: Config = migrate(DEFAULTS_V0)

export function migrate(prevConfig: ConfigV0 | ConfigV1): Config {
  const prevVersion = prevConfig.version
  let result: ConfigV0 | ConfigV1 = prevConfig

  // loop through the migrations, skipping any migrations that are unnecessary
  for (let i = prevVersion; i < MIGRATIONS.length; i++) {
    // NOTE(mc, 2020-05-22): Flow will always be unable to resolve this type
    // ensure good unit test coverage for this logic
    const migrateVersion = (MIGRATIONS: any)[i]
    result = migrateVersion(result)
  }

  if (result.version < CONFIG_VERSION_LATEST) {
    throw new Error(
      `Config migration failed; expected at least version ${CONFIG_VERSION_LATEST} but got ${result.version}`
    )
  }

  return ((result: any): Config)
}
