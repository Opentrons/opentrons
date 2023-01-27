import path from 'path'
import { app } from 'electron'
import uuid from 'uuid/v4'
import {
  CONFIG_VERSION_LATEST,
  OT2_MANIFEST_URL,
  OT3_MANIFEST_URL,
} from '@opentrons/app/src/redux/config'

import type {
  Config,
  ConfigV12,
  ConfigV13,
} from '@opentrons/app/src/redux/config/types'
// format
// base config v12 defaults
// any default values for later config versions are specified in the migration
// functions for those version below

export const DEFAULTS_V12: ConfigV12 = {
  version: 12,
  devtools: false,
  reinstallDevtools: false,
  update: { channel: _PKG_VERSION_.includes('beta') ? 'beta' : 'latest' },
  log: { level: { file: 'debug', console: 'info' } },
  ui: {
    width: 1024,
    height: 600,
    url: { protocol: 'file:', path: 'ui/index.html' },
    webPreferences: { webSecurity: true },
    minWidth: 600,
  },
  analytics: {
    appId: uuid(),
    optedIn: false,
    seenOptIn: true,
  },
  support: {
    userId: uuid(),
    createdAt: Math.floor(Date.now() / 1000),
    name: null,
    email: null,
  },
  discovery: {
    candidates: [],
    disableCache: false,
  },
  labware: {
    directory: path.join(app.getPath('userData'), 'labware'),
    showLabwareOffsetCodeSnippets: false,
  },
  alerts: { ignored: [] },
  p10WarningSeen: {},
  calibration: { useTrashSurfaceForTipCal: null },
  python: { pathToPythonOverride: null },
  modules: { heaterShaker: { isAttached: false } },
  isOnDevice: true,
  protocols: { sendAllProtocolsToOT3: false, protocolsStoredSortKey: null },
  robotSystemUpdate: {
    manifestUrls: {
      OT2: OT2_MANIFEST_URL,
      OT3: OT3_MANIFEST_URL,
    },
  },
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

// when we add our first migration, change to [(prevConfig: ConfigV12) => Config13]
const MIGRATIONS: [(prevConfig: ConfigV12) => ConfigV13] = [toVersion13]

export const DEFAULTS: Config = migrate(DEFAULTS_V12)

export function migrate(prevConfig: ConfigV12 | ConfigV13): Config {
  const prevVersion = prevConfig.version
  let result = prevConfig

  // loop through the migrations, skipping any migrations that are unnecessary
  for (let i: number = prevVersion; i < MIGRATIONS.length; i++) {
    const migrateVersion = MIGRATIONS[i]
    // @ts-expect-error (kj: 01/27/2023): migrateVersion function input typed to never
    result = migrateVersion(result)
  }

  if (result.version < CONFIG_VERSION_LATEST) {
    throw new Error(
      `Config migration failed; expected at least version ${CONFIG_VERSION_LATEST} but got ${result.version}`
    )
  }

  return result as Config
}
