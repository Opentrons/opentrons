import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import { STANDARD_SLOT_LOAD_NAME } from '@opentrons/shared-data'

import type { Fixture, LoadFixtureRunTimeCommand } from '@opentrons/shared-data'

export const CONFIGURED = 'configured'
export const CONFLICTING = 'conflicting'
export const NOT_CONFIGURED = 'not configured'

type LoadedFixtureConfigurationStatus =
  | typeof CONFIGURED
  | typeof CONFLICTING
  | typeof NOT_CONFIGURED

type LoadedFixtureConfiguration = LoadFixtureRunTimeCommand & {
  configurationStatus: LoadedFixtureConfigurationStatus
}

export function useLoadedFixturesConfigStatus(
  loadedFixtures: LoadFixtureRunTimeCommand[]
): LoadedFixtureConfiguration[] {
  const deckConfig = useDeckConfigurationQuery().data ?? []

  return loadedFixtures.map(loadedFixture => {
    const deckConfigurationAtLocation = deckConfig.find(
      (deckFixture: Fixture) =>
        deckFixture.fixtureLocation === loadedFixture.params.location.cutout
    )

    let configurationStatus: LoadedFixtureConfigurationStatus = NOT_CONFIGURED
    if (
      deckConfigurationAtLocation != null &&
      deckConfigurationAtLocation.loadName === loadedFixture.params.loadName
    ) {
      configurationStatus = CONFIGURED
    } else if (
      deckConfigurationAtLocation != null &&
      deckConfigurationAtLocation.loadName !== loadedFixture.params.loadName &&
      deckConfigurationAtLocation.loadName !== STANDARD_SLOT_LOAD_NAME
    ) {
      configurationStatus = CONFLICTING
    }

    return { ...loadedFixture, configurationStatus }
  })
}
