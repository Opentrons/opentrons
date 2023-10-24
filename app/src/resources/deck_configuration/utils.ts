import { v4 as uuidv4 } from 'uuid'

import { parseInitialLoadedFixturesByCutout } from '@opentrons/api-client'
import { STANDARD_SLOT_DECK_CONFIG_FIXTURE } from '@opentrons/components'

import type { DeckConfiguration, RunTimeCommand } from '@opentrons/shared-data'

export function getDeckConfigFromProtocolCommands(
  protocolAnalysisCommands: RunTimeCommand[]
): DeckConfiguration {
  const loadedFixtureCommands = Object.values(
    parseInitialLoadedFixturesByCutout(protocolAnalysisCommands)
  )

  const deckConfig = loadedFixtureCommands.map(command => ({
    fixtureId: command.params.fixtureId ?? uuidv4(),
    fixtureLocation: command.params.location.cutout,
    loadName: command.params.loadName,
  }))

  // TODO(bh, 2023-10-18): remove stub when load fixture commands available
  return deckConfig.length > 0 ? deckConfig : STANDARD_SLOT_DECK_CONFIG_FIXTURE
}
