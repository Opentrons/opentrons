import mapValues from 'lodash/mapValues'

import type { HostConfig } from '@opentrons/api-client'

export function getQueryKey(
  hostConfig: HostConfig | null,
  ...rest: unknown[]
): unknown[] {
  // Note that we avoid volatile components of the hostConfig,
  // such as the robotName and the access token.
  const hostKey =
    hostConfig == null
      ? null
      : {
          hostname: hostConfig.hostname,
          port: hostConfig.port,
        }

  // map undefined values to null to agree with react query caching
  // https://github.com/TanStack/query/issues/3741
  const sanitizedHostKey = mapValues(hostKey, v => (v !== undefined ? v : null))

  return [sanitizedHostKey, ...rest]
}
