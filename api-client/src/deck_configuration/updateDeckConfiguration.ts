import { PUT, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  DeckConfigurationResponse,
  UpdateDeckConfigurationRequest,
} from './types'
import type { DeckConfiguration } from '@opentrons/shared-data'

export function updateDeckConfiguration(
  config: HostConfig,
  deckConfig: DeckConfiguration
): ResponsePromise<DeckConfigurationResponse> {
  return request<DeckConfigurationResponse, UpdateDeckConfigurationRequest>(
    PUT,
    '/deck_configuration',
    { data: { cutoutFixtures: deckConfig } },
    config
  )
}
