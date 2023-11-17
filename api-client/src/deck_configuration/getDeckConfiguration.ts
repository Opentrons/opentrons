// import { GET, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { DeckConfiguration } from '@opentrons/shared-data'
// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

// TODO(bh, 2023-09-26): uncomment and remove deck config stub when backend api is ready
// export function getDeckConfiguration(
//   config: HostConfig
// ): ResponsePromise<DeckConfiguration> {
//   return request<DeckConfiguration>(GET, `/deck_configuration`, null, config)
// }

export function getDeckConfiguration(
  config: HostConfig
): Promise<{ data: DeckConfiguration }> {
  return Promise.resolve({ data: DECK_CONFIG_STUB })
}
