import type { DeckConfiguration } from '@opentrons/shared-data'

export interface UpdateDeckConfigurationRequest {
  data: {
    cutoutFixtures: DeckConfiguration
  }
}

export interface DeckConfigurationResponse {
  data: {
    cutoutFixtures: DeckConfiguration
    lastUpdatedAt: string
  }
}
