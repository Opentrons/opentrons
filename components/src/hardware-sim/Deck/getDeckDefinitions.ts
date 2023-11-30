import type { DeckDefinition } from '@opentrons/shared-data'

// TODO: Brian 2019-05-01 very similar to getAllDefinitions in labware-library,
// and PD labware-def utils should reconcile differences & make a general util
// fn imported from shared-data, but this relies on a webpack-specific method,
// and SD is not webpacked

const deckDefinitionsContext = require.context(
  '@opentrons/shared-data/deck/definitions/4',
  true, // traverse subdirectories
  /\.json$/, // import filter
  'sync' // load every definition into one synchronous chunk
)

export function getDeckDefinitions(): Record<string, DeckDefinition> {
  const deckDefinitions = deckDefinitionsContext
    .keys()
    .reduce((acc: Record<string, DeckDefinition>, filename: string) => {
      const def = deckDefinitionsContext<DeckDefinition>(filename)
      return { ...acc, [def.otId]: def }
    }, {})

  return deckDefinitions
}
