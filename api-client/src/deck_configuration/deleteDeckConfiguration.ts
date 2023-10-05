// import { DELETE, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { Fixture } from '@opentrons/shared-data'
// import type { ResponsePromise } from '../request'
import type { EmptyResponse, HostConfig } from '../types'

// TODO(bh, 2023-09-26): uncomment and remove deck config stub when backend api is ready
// export function deleteDeckConfiguration(
//   config: HostConfig,
//   data: Fixture
// ): ResponsePromise<EmptyResponse> {
//   const { fixtureLocation, ...rest } = data
//   return request<EmptyResponse, { data: Omit<Fixture, 'fixtureLocation'> }>(
//     DELETE,
//     `/deck_configuration/${fixtureLocation}`,
//     { data: rest },
//     config
//   )
// }

export function deleteDeckConfiguration(
  config: HostConfig,
  data: Fixture
): Promise<EmptyResponse> {
  const { fixtureLocation } = data
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete DECK_CONFIG_STUB[fixtureLocation]
  return Promise.resolve({ data: null })
}
