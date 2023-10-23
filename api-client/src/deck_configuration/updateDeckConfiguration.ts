import { v4 as uuidv4 } from 'uuid'

// import { PATCH, request } from '../request'
import { DECK_CONFIG_STUB } from './__stubs__'

import type { Fixture } from '@opentrons/shared-data'
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
  data: Omit<Fixture, 'fixtureId'>
): Promise<{ data: Fixture }> {
  const { fixtureLocation } = data
  const fixtureId = uuidv4()
  DECK_CONFIG_STUB[fixtureLocation] = { ...data, fixtureId }
  return Promise.resolve({ data: DECK_CONFIG_STUB[fixtureLocation] })
}
