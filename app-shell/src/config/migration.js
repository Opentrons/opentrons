// @flow

import type {
  Config,
  ConfigV0,
  ConfigV1,
} from '@opentrons/app/src/config/ConfigTypes'

// Update outdated entries
// Don't use getFullConfig() since that takes in overrides
// config version 1 migration
const toVersion1 = (prevConfig: ConfigV0): ConfigV1 => {
  const nextConfig = {
    ...prevConfig,
    discovery: {
      candidates: prevConfig.discovery.candidates,
      disableDiscoveryCache: false,
    },
  }
  return nextConfig
}

const MIGRATIONS = [toVersion1]

export function migrate(prevConfig: Config): Config {
  const prevVersion = prevConfig.version
  let result = prevConfig
  for (let i = prevVersion; i < MIGRATIONS.length; i++) {
    const migrateVersion = MIGRATIONS[i]
    result = { ...migrateVersion(result), version: i + 1 }
  }
  return result
}
