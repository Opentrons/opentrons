// import { PUT, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { DeckConfiguration } from '@opentrons/shared-data'
// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

// TODO(bh, 2023-09-26): uncomment and remove deck config stub when backend api is ready
// export function updateDeckConfiguration(
//   config: HostConfig,
//   data: DeckConfiguration
// ): ResponsePromise<DeckConfiguration> {
//   return request<DeckConfiguration, DeckConfiguration>(PUT, '/deck_configuration', data, config)
// }

export function updateDeckConfiguration(
  config: HostConfig,
  data: DeckConfiguration
): Promise<{ data: DeckConfiguration }> {
  data.forEach((fixture, i) => {
    DECK_CONFIG_STUB[i] = fixture
  })

  return Promise.resolve({ data: DECK_CONFIG_STUB })
}
