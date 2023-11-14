// import { PATCH, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { CutoutConfig } from '@opentrons/shared-data'
// import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

// TODO(bh, 2023-09-26): uncomment and remove deck config stub when backend api is ready
// export function updateDeckConfiguration(
//   config: HostConfig,
//   data: Omit<Fixture, 'fixtureId'>
// ): ResponsePromise<Fixture> {
//   const { fixtureLocation, ...rest } = data
//   return request<Fixture, { data: Omit<Fixture, 'fixtureLocation'> }>(
//     PATCH,
//     `/deck_configuration/${fixtureLocation}`,
//     { data: rest },
//     config
//   )
// }

export function updateDeckConfiguration(
  config: HostConfig,
  data: CutoutConfig
): Promise<{ data: CutoutConfig }> {
  const { cutoutId } = data
  DECK_CONFIG_STUB[cutoutId] = data
  return Promise.resolve({ data: DECK_CONFIG_STUB[cutoutId] })
}
