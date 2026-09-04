import { PUT, request } from '../request'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  DeckConfigurationResponse,
  UpdateDeckConfigurationRequest,
} from './types'

export function updateDeckConfiguration(
  config: HostConfig,
  deckConfig: DeckConfiguration,
  userNotes: string
): ResponsePromise<DeckConfigurationResponse> {
  return request<DeckConfigurationResponse, UpdateDeckConfigurationRequest>(
    PUT,
    '/deck_configuration',
    config,
    { body: { data: { cutoutFixtures: deckConfig } }, userNotes }
  )
}
