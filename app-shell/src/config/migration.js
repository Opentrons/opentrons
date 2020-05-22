// @flow

import type {
  ConfigV1,
  ConfigIntermediateV0ToV1,
} from '@opentrons/app/src/config/ConfigTypes'
import type { Config } from '@opentrons/app/src/config/types'

// config version 1 migration
const toVersion1 = (prevConfig: ConfigIntermediateV0ToV1): ConfigV1 => {
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
  const prevVersion = prevConfig.version | 0
  let result = prevConfig
  for (let i = prevVersion; i < MIGRATIONS.length; i++) {
    const migrateVersion = MIGRATIONS[i]
    result = { ...migrateVersion(result), version: i + 1 }
  }
  return result
}
