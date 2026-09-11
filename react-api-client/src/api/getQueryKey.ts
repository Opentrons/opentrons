import mapValues from 'lodash/mapValues'

import type { QueryKey } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'

export function getQueryKey(
  hostConfig: HostConfig | null,
  ...rest: unknown[]
): QueryKey {
  // Note that we avoid volatile components of the hostConfig,
  // such as the robotName and the access token.
  const hostKey =
    hostConfig == null
      ? null
      : {
          hostname: hostConfig.hostname,
          port: hostConfig.port,
          requestor: hostConfig.requestor,
          secure: hostConfig.secure,
        }

  // map undefined values to null to agree with react query caching
  // https://github.com/TanStack/query/issues/3741
  const sanitizedHostKey = mapValues(hostKey, v => (v !== undefined ? v : null))

  return [sanitizedHostKey, ...rest]
}
