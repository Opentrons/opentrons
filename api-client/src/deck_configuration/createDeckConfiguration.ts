// import { POST, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { DeckConfiguration } from '@opentrons/shared-data'
// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

// TODO(bh, 2023-09-26): uncomment and remove deck config stub when backend api is ready
// export function createDeckConfiguration(
//   config: HostConfig,
//   data: DeckConfiguration
// ): ResponsePromise<DeckConfiguration> {
//   return request<DeckConfiguration, { data: DeckConfiguration }>(
//     POST,
//     `/deck_configuration`,
//     { data },
//     config
//   )
// }

export function createDeckConfiguration(
  config: HostConfig,
  data: DeckConfiguration
): Promise<{ data: DeckConfiguration }> {
  data.forEach(fixture => {
    DECK_CONFIG_STUB[fixture.fixtureLocation] = fixture
  })
  return Promise.resolve({ data: Object.values(DECK_CONFIG_STUB) })
}
