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
  ConfigV14,
  ConfigV15,
  ConfigV16,
  ConfigV17,
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

const BASE_CONFIG_VERSION = Number(DEFAULTS_V12.version)

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
  // sleepMs: never(no sleep), brightness device default settings, textSize x1
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
      unfinishedUnboxingFlowRoute: '/welcome',
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

const MIGRATIONS: [
  (prevConfig: ConfigV12) => ConfigV13,
  (prevConfig: ConfigV13) => ConfigV14,
  (prevConfig: ConfigV14) => ConfigV15,
  (prevConfig: ConfigV15) => ConfigV16,
  (prevConfig: ConfigV16) => ConfigV17
] = [toVersion13, toVersion14, toVersion15, toVersion16, toVersion17]

export const DEFAULTS: Config = migrate(DEFAULTS_V12)

export function migrate(
  prevConfig:
    | ConfigV12
    | ConfigV13
    | ConfigV14
    | ConfigV15
    | ConfigV16
    | ConfigV17
): Config {
  let result = prevConfig
  // loop through the migrations, skipping any migrations that are unnecessary
  // Note: the default version of app-shell-odd is version 12 (need to adjust the index range)
  for (
    let i: number = prevConfig.version;
    i < BASE_CONFIG_VERSION + MIGRATIONS.length;
    i++
  ) {
    const migrateVersion = MIGRATIONS[i - BASE_CONFIG_VERSION]
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
